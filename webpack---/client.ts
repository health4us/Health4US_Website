import { createLogger, createBiReporter } from '@wix/thunderbolt-environment'
// eslint-disable-next-line @wix/thunderbolt/no-internal-import
import { createPerfReporter } from '@wix/thunderbolt-environment/src/performanceReporter' // Importing this way because of "Cannot find module" error
import { fixViewport } from './lib/fixViewport'
import { fixBodyClasses } from './lib/bodyClasses'
import './assets/scss/viewer.global.scss' // Only import it so it will be written in manifest.json
import { featuresLoaders } from 'thunderbolt-features-loaders'
import { instance as biInstance } from './bi-module/instance'
import { createDomReadyPromise, IThunderboltClient, getThunderboltInitializer } from 'feature-thunderbolt-initializer'
import { createFeaturesLoader } from '@wix/thunderbolt-features'
import {
	clientModuleFetcher,
	createClientSAC,
	csmFetcher,
	toClientSACFactoryParams,
} from 'thunderbolt-site-assets-client'
import { BeatEventType, ILogger } from '@wix/thunderbolt-symbols'
import { fedopsMetricsReporter, FetchApi, taskify, yieldToMain } from '@wix/thunderbolt-commons'
import { Hub } from '@sentry/types'
import type { Environment } from '@wix/thunderbolt-environment'
import { Container } from '@wix/thunderbolt-ioc'
import { ClientRenderResponse } from 'feature-react-renderer'
import { IComponentsRegistrar } from '@wix/thunderbolt-components-loader'
import Div from './div'
import { addScriptGroupsBiFields } from './groups-bundling/scriptGroupsBiFields'
import { observeLongTasks } from './observeLongTasks'
import { factory as biLoggerFactory } from '@wix/fe-essentials-viewer-platform/bi'

const { viewerModel, Sentry, bi } = window
const fetchFn = window.fetch

// Init the Pulse Library
const perfReporter = createPerfReporter({
	logger: biLoggerFactory({ useBatch: true }).logger(),
	sessionId: viewerModel.site.sessionId,
	msid: viewerModel.site.metaSiteId,
	vsi: bi.wixBiSession.viewerSessionId,
})

const reportBI = biInstance.reportBI.bind(biInstance)
const sendBeat = biInstance.sendBeat.bind(biInstance)
const setDynamicSessionData = biInstance.setDynamicSessionData.bind(biInstance)
const reportPageNavigation = biInstance.reportPageNavigation.bind(biInstance)
const reportPageNavigationDone = biInstance.reportPageNavigationDone.bind(biInstance)

observeLongTasks()
const getComponentLibraries = async ({ logger }: { logger: ILogger }): Promise<Array<IComponentsRegistrar>> => {
	logger.phaseStarted('thunderbolt-components-registry/client download')
	const { createComponentsRegistryCSR } = await import(
		'@wix/thunderbolt-components-registry/client' /* webpackChunkName: "thunderbolt-components-registry" */
	)
	logger.phaseEnded('thunderbolt-components-registry/client download')
	logger.phaseStarted('createComponentsRegistryCSR')
	const componentsRegistry = await createComponentsRegistryCSR({
		runAndReport: (metric, fn) => {
			return logger.runAsyncAndReport(fn, 'thunderbolt-app', metric)
		},
	})
	logger.phaseEnded('createComponentsRegistryCSR')
	return [componentsRegistry.getComponentsLibrariesAPI()]
}

const runThunderbolt = async () => {
	const { experiments, viewMode, requestUrl, mode } = viewerModel
	const delayClientSide =
		mode.ssrOnly && !window.onBeforeStart
			? new Promise(() => {
					// never resolve if ssrOnly is requested but renderIndicator is turned off (onBeforeStart isn't set by it)
					console.log('Hanging client side rendering - ssrOnly is true and ssrIndicator is false')
			  })
			: window.onBeforeStart
	await Promise.resolve(delayClientSide) // for render indicator - should resolve immediately in production
	createDomReadyPromise(true)
		.then(() => fixBodyClasses(viewerModel, window))
		.catch((e) => {
			throw new Error(`Dom ready promise failed with error - ${e}`)
		})
	await yieldToMain()
	const logger = await createLogger({
		sentry: (Sentry as unknown) as Hub,
		wixBiSession: biInstance.wixBiSession,
		viewerModel,
		fetch: fetchFn,
	})
	await yieldToMain()
	logger.phaseStarted('runThunderbolt-client')
	const biReporter = createBiReporter(
		reportBI,
		sendBeat,
		setDynamicSessionData,
		reportPageNavigation,
		reportPageNavigationDone
	)

	logger.phaseStarted('component_loader')
	const componentLibraries: Promise<Array<IComponentsRegistrar>> = getComponentLibraries({
		logger,
	})
	logger.phaseEnded('component_loader')

	const getWarmupData = () => JSON.parse(document.getElementById('wix-warmup-data')?.textContent || '{}')

	const { siteAssets } = viewerModel

	await yieldToMain()
	logger.phaseStarted('load_environment')
	const environment: Environment = {
		waitForDomReady: createDomReadyPromise,
		wixBiSession: biInstance.wixBiSession,
		viewerModel,
		biReporter,
		siteAssetsClient: createClientSAC(
			toClientSACFactoryParams({
				viewerModel,
				fetchFn,
				siteAssetsMetricsReporter: fedopsMetricsReporter(logger),
				moduleFetcher: clientModuleFetcher(
					fetchFn,
					siteAssets.clientTopology,
					{
						thunderbolt: siteAssets.manifests,
					},
					'web'
				),
				experiments,
				csmFetcher: csmFetcher({ ...viewerModel.site, fetch: fetchFn, logger }),
			})
		),
		fetchApi: FetchApi(requestUrl, fetchFn),
		specificEnvFeaturesLoaders: createFeaturesLoader(featuresLoaders, { experiments, logger }),
		componentLibraries,
		logger,
		experiments,
		browserWindow: window,
		warmupData: createDomReadyPromise().then(getWarmupData),
		contextualSsrLogger: null,
		BaseComponent: Div,
		perfReporter,
	}
	const thunderboltInitializer = getThunderboltInitializer(Container())
	await yieldToMain()
	thunderboltInitializer.loadEnvironment(environment)
	logger.phaseEnded('load_environment')

	logger.phaseStarted('load_renderer')
	const rendererPromise = taskify(async () => {
		return thunderboltInitializer.getRenderer<ClientRenderResponse>()
	})

	const renderer = await taskify(async () => {
		try {
			await thunderboltInitializer.loadSiteFeatures()
		} catch (e) {
			logger.captureError(e, {
				tags: { feature: 'thunderbolt-app', phase: 'load_site_features' },
				groupErrorsBy: 'values',
			})
		}
		return rendererPromise
	})
	logger.phaseEnded('load_renderer')

	logger.phaseStarted('tb_client')
	const thunderboltClient = await taskify(async () => {
		return (await thunderboltInitializer.getThunderboltInvoker<IThunderboltClient>())()
	})
	logger.phaseEnded('tb_client')

	const { firstPageId } = await taskify(async () => {
		try {
			logger.phaseStarted('client_render')
			await renderer.render({})
			logger.phaseEnded('client_render')
		} catch (e) {
			logger.captureError(e, {
				tags: { feature: 'thunderbolt-app', phase: 'client_render' },
				groupErrorsBy: 'values',
			})
		}
		return taskify(() => thunderboltClient.appDidMount())
	})

	if (viewMode === 'mobile') {
		await taskify(() => fixViewport())
	}

	biReporter.sendBeat(BeatEventType.PAGE_FINISH, 'page interactive', { pageId: firstPageId })
	logger.phaseEnded('runThunderbolt-client')

	const totalCssSize = Array.from(document.querySelectorAll('style'))
		.reduce((acc, style) => acc + style.innerHTML.length, 0)
		.toString()

	if (window.React && window.React.version && window.React.version.startsWith('18')) {
		logger.meter('react_18')
	}

	logger.appLoaded({
		paramsOverrides: {
			pageId: firstPageId,
			...addScriptGroupsBiFields(),
			totalCssSize,
			reactVersion: window.React && window.React.version,
		},
	})
}

void runThunderbolt()
