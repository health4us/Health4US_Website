import { loadRequireJS } from '@wix/thunderbolt-commons'
import { named, withDependencies } from '@wix/thunderbolt-ioc'
import {
	BrowserWindow,
	BrowserWindowSymbol,
	Experiments,
	ExperimentsSymbol,
	ILogger,
	LoggerSymbol,
	SiteFeatureConfigSymbol,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import { ComponentType } from 'react'
import { OOIReporterSymbol, Reporter } from '../reporting'
import { ModuleFederationSharedScopeSymbol, name } from '../symbols'
import { Props } from '../tpaWidgetNativeFactory/tpaWidgetNative'
import type { OOIComponentLoader, WebpackSharedScope } from '../types'
import { loadComponentWithModuleFederation } from './loadComponentWithModuleFederation'
import { extractWidgetNameFromUrl } from '../extractWidgetNameFromUrl'
import { OOISiteConfig } from '../types'

async function requireTpaWidgetNativeClient() {
	await window.externalsRegistry.react.loaded // wait for React to load since it is loaded dynamically
	return require('../tpaWidgetNativeFactory/tpaWidgetNativeClient')
}

export default withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		ViewerModelSym,
		LoggerSymbol,
		OOIReporterSymbol,
		BrowserWindowSymbol,
		ExperimentsSymbol,
		ModuleFederationSharedScopeSymbol,
	],
	(
		{ ooiComponentsData }: OOISiteConfig,
		{ siteAssets, requestUrl, mode: { debug } }: ViewerModel,
		logger: ILogger,
		reporter: Reporter,
		window: NonNullable<BrowserWindow>,
		experiments: Experiments,
		sharedScope: WebpackSharedScope
	): OOIComponentLoader => {
		let waitForRequireJsToLoad: Promise<unknown> | null = null

		const loadAndConfigureRequireJS = async () => {
			await loadRequireJS(window, siteAssets.clientTopology.moduleRepoUrl)

			// @ts-ignore
			window.require.config({
				waitSeconds: 30,
			})

			// @ts-ignore TODO fix requirejs type
			window.requirejs!.onError = (error) => {
				const { requireModules, requireType } = error
				logger.captureError(error, {
					tags: { feature: 'commons', methodName: 'requirejs.onError' },
					extra: { requireModules, requireType },
				})
			}
		}

		const load = <T>(url: string): Promise<T> =>
			new Promise(async (resolve, reject) => {
				waitForRequireJsToLoad = waitForRequireJsToLoad || loadAndConfigureRequireJS()
				await waitForRequireJsToLoad

				__non_webpack_require__([url], (module: any) => resolve(module), reject)
			})

		async function loadFederated<T>(url: string): Promise<T> {
			waitForRequireJsToLoad = waitForRequireJsToLoad || loadAndConfigureRequireJS()
			await waitForRequireJsToLoad
			const widgetName = extractWidgetNameFromUrl(url)
			const moduleFederationEntryUrl = url.replace(/\/[^/]+\.js$/, `/clientContainer${widgetName}.min.js`)

			return await loadComponentWithModuleFederation(moduleFederationEntryUrl, widgetName!, sharedScope)
		}

		async function renderDeadComponent() {
			const { ooiReactComponentClientWrapper } = await requireTpaWidgetNativeClient()
			return { component: ooiReactComponentClientWrapper(null, reporter) }
		}

		return {
			async getComponent(widgetId: string, useNoCssComponentIfExists: boolean = true) {
				if (requestUrl.includes('disableAllPlatformApps')) {
					return renderDeadComponent()
				}
				if (!ooiComponentsData[widgetId]) {
					logger.captureError(new Error('widgetId could not be found in ooiComponentsData'), {
						tags: { feature: 'ooi', methodName: 'getComponent' },
						extra: { widgetId },
					})

					return renderDeadComponent()
				}

				const { componentUrl: withCssComponentUrl, noCssComponentUrl, isModuleFederated } = ooiComponentsData[
					widgetId
				]
				const componentUrl = useNoCssComponentIfExists
					? noCssComponentUrl || withCssComponentUrl
					: withCssComponentUrl

				const module = await (isModuleFederated && experiments['specs.thunderbolt.module_federation']
					? loadFederated<{ default: ComponentType<Props> }>(componentUrl)
					: load<{ default: ComponentType<Props> }>(componentUrl)
				).catch((err) => {
					if (debug) {
						console.error(`widget failed to load [${widgetId}]:`, err)
					}
				})

				if (!module || !module.default) {
					logger.captureError(new Error('widget did not return a module of React component'), {
						tags: { feature: 'ooi', methodName: 'getComponent' },
						extra: {
							widgetId,
							componentUrl,
							isModuleFederated,
							module_federation: experiments['specs.thunderbolt.module_federation'],
						},
					})

					return renderDeadComponent()
				}

				const { ooiReactComponentClientWrapper } = await requireTpaWidgetNativeClient()
				// @ts-ignore
				const { component, chunkLoadingGlobal, loadableReady } = module?.default

				return {
					component: ooiReactComponentClientWrapper(component, reporter),
					chunkLoadingGlobal,
					loadableReady,
				}
			},
		}
	}
)
