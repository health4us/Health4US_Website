import _ from 'lodash'
import { proxy, wrap, createEndpoint } from 'comlink/dist/esm/comlink.js' // eslint-disable-line no-restricted-syntax
import { withDependencies } from '@wix/thunderbolt-ioc'
import {
	IComponentsStylesOverrides,
	IPropsStore,
	Props,
	Structure,
	ComponentsStylesOverridesSymbol,
	PlatformWorkerPromiseSym,
	PlatformWorkerPromise,
	ILogger,
	LoggerSymbol,
	IStructureStore,
} from '@wix/thunderbolt-symbols'
import type { BootstrapData, PlatformInitializer, PlatformWarmupDataManagerAPI } from '../types'
import type { InvokeSiteHandler, InvokeViewerHandler, PlatformClientWorkerAPI } from '../core/types'
import { PlatformWarmupDataManagerSymbol } from '../symbols'

export default withDependencies<PlatformInitializer>(
	[PlatformWarmupDataManagerSymbol, Props, Structure, ComponentsStylesOverridesSymbol, LoggerSymbol, PlatformWorkerPromiseSym],
	(
		platformWarmupDataManager: PlatformWarmupDataManagerAPI,
		propsStore: IPropsStore,
		structureStore: IStructureStore,
		componentsStylesOverrides: IComponentsStylesOverrides,
		logger: ILogger,
		{ platformWorkerPromise }: { platformWorkerPromise: PlatformWorkerPromise }
	): PlatformInitializer => {
		platformWorkerPromise.then((worker) =>
			worker!.addEventListener('error', ({ message }) => {
				logger.captureError(new Error(message), {
					tags: { feature: 'platform', worker: true, dontReportIfPanoramaEnabled: true },
				})
			})
		)

		return {
			async initPlatformOnSite(bootstrapData: BootstrapData, invokeSiteHandler: InvokeSiteHandler) {
				const worker = (await platformWorkerPromise)!
				const { initPlatformOnSite }: PlatformClientWorkerAPI = wrap(worker)
				initPlatformOnSite(
					bootstrapData,
					proxy(async (...args) => {
						const res = await invokeSiteHandler(...args)
						return _.isFunction(res) ? proxy(res) : res
					})
				)
			},
			async runPlatformOnPage(bootstrapData: BootstrapData, invokeViewerHandler: InvokeViewerHandler) {
				const worker = (await platformWorkerPromise)!
				const workerProxy = wrap(worker)
				const workerMessagePort = await workerProxy[createEndpoint]()
				// prevent malicious "self.onmessage =" user code from sniffing messages upon navigation, specifically platformEnvData.site.applicationsInstances.
				const workerSecureProxy: PlatformClientWorkerAPI = wrap(workerMessagePort)
				return workerSecureProxy.runPlatformOnPage(
					bootstrapData,
					proxy(async (...args) => {
						const res = await invokeViewerHandler(...args)
						return _.isFunction(res) ? proxy(res) : res
					})
				)
			},
			async updateProps(partialProps) {
				if (await platformWarmupDataManager.shouldUseManager()) {
					platformWarmupDataManager.updateProps(partialProps)
				} else {
					propsStore.update(partialProps)
				}
			},
			async updateStyles(styleData) {
				if (await platformWarmupDataManager.shouldUseManager()) {
					platformWarmupDataManager.updateStyles(styleData)
				} else {
					componentsStylesOverrides.set(styleData)
				}
			},
			async updateStructure(partialStructure) {
				if (await platformWarmupDataManager.shouldUseManager()) {
					platformWarmupDataManager.updateStructure(partialStructure)
				} else {
					structureStore.update(partialStructure)
				}
			},
		}
	}
)
