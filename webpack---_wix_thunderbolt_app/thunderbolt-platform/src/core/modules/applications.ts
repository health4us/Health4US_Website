import _ from 'lodash'
import type { ManagerSlave } from '@wix/bsi-manager'
import { getDisplayedId, getFullItemId, createPromise } from '@wix/thunderbolt-commons'
import type { ViewerPlatformEssentials } from '@wix/fe-essentials-viewer-platform'
import { createBatchQueue } from '@wix/fe-essentials-viewer-platform/bi'
import type {
	AppModule,
	AppParams,
	IModelsAPI,
	WixCodeApi,
	PlatformAPI,
	ControllersApi,
	IPlatformUtils,
	IPlatformLogger,
	ClientSpecMapAPI,
	ControllerDataAPI,
	ControllerDataItem,
	ControllerInstance,
	PlatformServicesAPI,
	ComponentEventContext,
	ControllerModules,
	ICommonConfigModule,
	WidgetViewStateUpdateParams,
	PlatformModel,
	LivePreviewOptions,
} from '@wix/thunderbolt-symbols'
import type { BootstrapData } from '../../types'
import { createAppParams } from '../appsAPI/appParams'
import { createControllersParams } from '../appsAPI/controllerParams'
import { createPlatformAppServicesApi } from '../appsAPI/platformServicesAPI'
import type { PlatformDebugApi } from '../debug'
import type { ControllerData, IComponentSdksManager, IControllersExports, IViewerHandlers, IUnfinishedTasks } from '../types'
import { BlocksPreviewAppDefId, EVENT_CONTEXT_SCOPE, WixCodeAppDefId } from '../constants'
import type { IAppsUrls } from './appsUrls'
import type { IWixSelector } from './wixSelector'
import type { IAppsPublicApi } from './appsPublicApi'
import type { IInstanceCache } from './instanceCache'
import type { IBlocksAppsUtils } from './blocksAppsUtils'
import type { ISetPropsManager } from './setPropsManager'
import type { IWixCodeApiFactory } from './wixCodeApiFactory'
import type { IWixCodeViewerAppUtils } from './wixCodeViewerAppUtils'
import type { IModuleFederationManager } from './moduleFederationManager'
import type { IDataBindingViewerAppUtils } from './dataBindingViewerAppUtils'
import type { IPlatformApi } from './platformApi'
import type { IStaticEventsManager } from './staticEventsManager'
import type { IRegisterEvent } from './registerEvent'
import type { PlatformApiFactory, PlatformApiProvider } from './platformApiProvider'
import type { ISlotsManager } from './slotsManager'
import {
	APPLICATIONS,
	APPS_PUBLIC_API,
	APPS_URLS,
	BLOCKS_APPS_UTILS,
	BOOTSTRAP_DATA,
	BSI_MANAGER,
	CLIENT_SPEC_MAP_API,
	COMMON_CONFIG,
	COMPONENT_SDKS_MANAGER,
	CONTROLLERS_EXPORTS,
	DATA_BINDING_VIEWER_APP_UTILS,
	DEBUG_API,
	IMPORT_SCRIPTS,
	INSTANCE_CACHE,
	MODELS_API,
	MODULE_FEDERATION_MANAGER,
	PLATFORM_API,
	PLATFORM_API_PROVIDER,
	PLATFORM_ESSENTIALS,
	PLATFORM_LOGGER,
	PLATFORM_UTILS,
	REGISTER_EVENT,
	SET_PROPS_MANAGER,
	SLOTS_MANAGER,
	STATIC_EVENTS_MANAGER,
	UNFINISHED_TASKS,
	VIEWER_HANDLERS,
	WIX_CODE_API_FACTORY,
	WIX_CODE_VIEWER_APP_UTILS,
	WIX_SELECTOR,
} from './moduleNames'

const createControllerItemContext = (repeaterCompId: string, itemId: string) =>
	({
		type: EVENT_CONTEXT_SCOPE.COMPONENT_SCOPE,
		itemId,
		_internal: {
			repeaterCompId,
		},
	} as ComponentEventContext)

export type CreateRepeatedControllersFn = (repeaterId: string, itemIds: Array<string>) => Promise<() => Promise<void>>

export type IApplications = {
	createRepeatedControllers: CreateRepeatedControllersFn
	init: () => Promise<any>
}

const Applications = (
	appsPublicApi: IAppsPublicApi,
	wixSelector: IWixSelector,
	modelsApi: IModelsAPI,
	clientSpecMapApi: ClientSpecMapAPI,
	appsUrls: IAppsUrls,
	bootstrapData: BootstrapData,
	importScripts: (url: string) => Promise<void>,
	wixCodeViewerAppUtils: IWixCodeViewerAppUtils,
	blocksAppsUtils: IBlocksAppsUtils,
	dataBindingViewerAppUtils: IDataBindingViewerAppUtils,
	logger: IPlatformLogger,
	wixCodeApiFactory: IWixCodeApiFactory,
	{ createSetPropsForOOI, waitForUpdatePropsPromises }: ISetPropsManager,
	controllersExports: IControllersExports,
	createPlatformApiForApp: IPlatformApi,
	{ bsiManager }: { bsiManager: ManagerSlave },
	platformUtils: IPlatformUtils,
	essentials: ViewerPlatformEssentials,
	commonConfig: ICommonConfigModule,
	{ viewerHandlers }: IViewerHandlers,
	moduleFederationManager: IModuleFederationManager,
	sdkInstancesCache: IInstanceCache,
	staticEventsManager: IStaticEventsManager,
	compEventsManager: IRegisterEvent,
	platformApiFactory: PlatformApiFactory,
	slotsManager: ISlotsManager,
	componentSdksManager: IComponentSdksManager,
	unfinishedTasks: IUnfinishedTasks,
	debugApi?: PlatformDebugApi
): IApplications => {
	const {
		platformEnvData: {
			router: { dynamicRouteData },
			window: { csrfToken },
			site: { viewMode, experiments },
			location: { rawUrl },
		},
	} = bootstrapData
	const isEditorMode = viewMode === 'Editor'
	const applications = modelsApi.getApplications()
	const controllerConfigs = modelsApi.getControllerConfigs()

	const dynamicControllersLifecycles: Set<Promise<unknown>> = new Set()

	const loadControllerModules = async (controllersData: Array<ControllerDataItem>, viewerScriptUrl: string) => {
		const controllerModules: ControllerModules = {}
		await Promise.all(
			_.map(controllersData, async ({ controllerType, applicationId, compId }: ControllerDataItem) => {
				const controller = await moduleFederationManager.loadControllerModule(
					{
						controllerType,
						applicationId,
						compId,
					},
					viewerScriptUrl
				)
				if (controller) {
					controllerModules[controllerType] = controller
				}
			})
		)
		return controllerModules
	}

	const registerControllerHooks = (controllerCompId: string, controllerParams: ControllerDataAPI, controller: ControllerInstance) => {
		if (controllerParams.appParams.appDefinitionId === BlocksPreviewAppDefId && controller.exports) {
			viewerHandlers.controllers.registerExportsSetter(controllerCompId, (props: Record<string, any>) => {
				Object.assign(controller.exports!() as Record<string, any>, props)
			})
		}

		if (!isEditorMode) {
			return
		}

		if (controller.updateConfig) {
			viewerHandlers.controllers.registerToConfigUpdate(controllerCompId, (updatedConfig: unknown) => controller.updateConfig!(controllerParams.$w, updatedConfig))
		}
		if (controller.updateAppSettings) {
			viewerHandlers.controllers.registerToAppSettingsUpdate(controllerCompId, (updatedSettings: unknown) => controller.updateAppSettings!(controllerParams.$w, updatedSettings))
		}
		if (controller.updateWidgetViewState) {
			viewerHandlers.controllers.registerToWidgetViewStateUpdate(controllerCompId, (state: WidgetViewStateUpdateParams) => controller.updateWidgetViewState!(state.stateName, state.stateProps))
		}
	}

	const runAppControllers = async (appDefinitionId: string, livePreviewOptions: Partial<LivePreviewOptions> | undefined) => {
		const controllersData = _(applications[appDefinitionId])
			.values()
			.filter(
				experiments['specs.thunderbolt.support_controllersToRefresh_livePreview_flag']
					? (controller) => !livePreviewOptions?.controllersToRefresh || livePreviewOptions.controllersToRefresh.includes(controller.compId)
					: () => true
			)
			.map((controller) => {
				const controllerCompId = controller.compId
				const controllerConfig = controllerConfigs[appDefinitionId][controllerCompId]
				const controllers = [{ ...controller, config: controllerConfig }] as Array<ControllerData>

				// TODO consider not repeating controllers in static items if the repeater is connected to data binding
				if (modelsApi.isRepeaterTemplate(controllerCompId)) {
					// if controller inside repeater template => create a controller params for each item, with its own context
					const repeaterCompId = modelsApi.getRepeaterIdByCompId(controllerCompId)!
					const repeatedControllerConfigs = modelsApi.getRepeatedControllersConfigs(appDefinitionId, controllerCompId)
					_.forEach(repeatedControllerConfigs, (repeatedControllerConfig, repeatedControllerCompId) => {
						const itemId = getFullItemId(repeatedControllerCompId)
						controllers.push({
							...controller,
							config: repeatedControllerConfig,
							context: createControllerItemContext(repeaterCompId, itemId),
						})
					})
				}

				return controllers
			})
			.flatten()
			.value()

		const { viewerScriptUrl, appModule, appParams, wixCodeApi, platformAppServicesApi, platformApi, platformApiProvider } = appsState[appDefinitionId]
		const widgetsClientSpecMapData = clientSpecMapApi.getWidgetsClientSpecMapData(appDefinitionId)

		const controllersParams = createControllersParams(
			createSetPropsForOOI,
			controllersData,
			modelsApi.getAllConnections(),
			wixSelector,
			slotsManager,
			widgetsClientSpecMapData,
			appParams,
			wixCodeApi,
			platformAppServicesApi,
			platformApi,
			csrfToken,
			essentials,
			platformAppServicesApi.essentials,
			platformApiProvider,
			livePreviewOptions
		)

		if (appDefinitionId === WixCodeAppDefId) {
			debugApi?.setWixCodeInterfaces({ wixCodeApi, $w: controllersParams[0].controllerParams.$w })
		}

		const controllerModules = await loadControllerModules(controllersData, viewerScriptUrl)
		appsState[appDefinitionId].controllerModules = controllerModules

		logger.reportAppPhasesNetworkAnalysis(appDefinitionId)

		await componentSdksManager.waitForSdksToLoad()
		const controllerPromises = await logger.withReportingAndErrorHandling(
			'create_controllers',
			async () => {
				if (experiments['specs.thunderbolt.support_controllersToRefresh_livePreview_flag'] && livePreviewOptions?.controllersToRefresh) {
					await Promise.all(controllersParams.map(({ controllerCompId }) => appsState[appDefinitionId].controllers[controllerCompId]?.dispose?.()))
					controllersParams.forEach(({ controllerCompId }) => sdkInstancesCache.clearCacheByPredicate((compCacheParams) => compCacheParams.controllerCompId === controllerCompId))
				}

				return appModule.createControllers(
					controllersParams.map((item) => item.controllerParams),
					controllerModules
				)
			},
			{ appDefinitionId }
		)
		appsState[appDefinitionId].controllerPromises = controllerPromises || []

		const controllersApi: ControllersApi = { getAll: () => appsState[appDefinitionId].controllerPromises || [] }
		const exports = _.isFunction(appModule.exports) ? appModule.exports({ controllersApi }) : appModule.exports

		appsPublicApi.resolvePublicApi(appDefinitionId, exports) // todo @nitzanh - support dynamic items' controllers

		if (!controllerPromises) {
			return
		}

		await Promise.all(
			controllerPromises.map(async (controllerPromise, index) => {
				const { controllerCompId, controllerParams } = controllersParams[index]
				const reportingParams = { appDefinitionId, controllerType: controllerParams.type, controllerCompId }
				const controller = await logger.withReportingAndErrorHandling('await_controller_promise', () => controllerPromise, reportingParams)
				if (!controller) {
					return
				}
				appsState[appDefinitionId].controllers[controllerCompId] = controller

				const controllerContext = controllersData[index].context
				const repeatedController = !!controllerContext
				controllersExports[repeatedController ? getDisplayedId(controllerCompId, controllerContext.itemId) : controllerCompId] = controller.exports
				const pageReadyFunc = () => Promise.resolve(controller.pageReady(controllerParams.$w, wixCodeApi))
				wixSelector.onPageReady(() => logger.withReportingAndErrorHandling('controller_page_ready', pageReadyFunc, reportingParams), controllerCompId, repeatedController)
				registerControllerHooks(controllerCompId, controllerParams, controller)
			})
		)
	}

	const runApplication = async (appDefinitionId: string) => {
		const viewerScriptUrl = appsUrls.getViewerScriptUrl(appDefinitionId)
		if (!viewerScriptUrl) {
			// Might be because clientSpecMap data corruption
			const error = new Error('Could not find viewerScriptUrl. The Application might be missing from the CSM')
			logger.captureError(error, {
				tags: { missingViewerScriptUrl: true },
				extra: { appDefinitionId },
			})
			appsPublicApi.resolvePublicApi(appDefinitionId, null)
			return
		}

		const appModule = await moduleFederationManager.loadAppModule(appDefinitionId, viewerScriptUrl)
		if (!appModule) {
			// error loading app module. errors are reported via moduleLoader.
			appsPublicApi.resolvePublicApi(appDefinitionId, null)
			return
		}
		const appSpecData = clientSpecMapApi.getAppSpecData(appDefinitionId)
		const routerConfigMap = _.filter(bootstrapData.platformAPIData.routersConfigMap, { appDefinitionId })
		const appParams = createAppParams({
			appSpecData,
			wixCodeViewerAppUtils,
			blocksAppsUtils,
			dataBindingViewerAppUtils,
			dynamicRouteData,
			routerConfigMap,
			appInstance: platformUtils.sessionService.getInstance(appDefinitionId),
			baseUrls: appsUrls.getBaseUrls(appDefinitionId),
			viewerScriptUrl,
			blocksData: clientSpecMapApi.getBlocksData(appDefinitionId),
			publicAppData: modelsApi.getPublicAppData(appDefinitionId),
		})
		const instanceId = appParams.instanceId

		const batchQueueBi = createBatchQueue()
		const batchQueueFedops = createBatchQueue()
		const platformAppServicesApi = createPlatformAppServicesApi({
			platformEnvData: bootstrapData.platformEnvData,
			appDefinitionId,
			instanceId,
			csrfToken,
			bsiManager,
			sessionService: platformUtils.sessionService,
			essentials,
			blocksAppsUtils,
			batchQueueBi,
			batchQueueFedops,
		})
		const platformApiProvider = platformApiFactory.initPlatformApiProvider(platformAppServicesApi.essentials, appDefinitionId)
		const platformApi = createPlatformApiForApp(appDefinitionId, instanceId, platformApiProvider)
		const wixCodeApi = await logger.runAsyncAndReport(`init_wix_code_apis ${appDefinitionId}`, () =>
			wixCodeApiFactory.initWixCodeApiForApplication(appDefinitionId, platformAppServicesApi.essentials)
		)
		if (appDefinitionId === WixCodeAppDefId) {
			// TODO refactor storage to be a wix code api, ask all verticals to take it from there instead of platform api and eventually remove from platform api.
			wixCodeApi.storage = platformApi.storage
		}

		if (appModule.initAppForPage) {
			await logger.withReportingAndErrorHandling('init_app_for_page', () => appModule.initAppForPage!(appParams, platformApi, wixCodeApi, platformAppServicesApi), { appDefinitionId })
		}

		appsState[appDefinitionId] = { viewerScriptUrl, appModule, appParams, wixCodeApi, platformAppServicesApi, platformApi, platformApiProvider, controllers: {} }

		await runAppControllers(appDefinitionId, bootstrapData.platformEnvData.livePreviewOptions)
	}

	const runApplications = async (appDefinitionIds: Array<string>) => {
		await Promise.all(
			appDefinitionIds.map((appDefinitionId) =>
				runApplication(appDefinitionId).catch((error) => {
					appsPublicApi.resolvePublicApi(appDefinitionId, null)
					logger.captureError(error, { tags: { method: 'runApplication' }, extra: { appDefinitionId } })
				})
			)
		)

		await wixSelector.flushOnReadyCallbacks()
		const removeUnfinishedTask = unfinishedTasks.add('await_dynamicControllersLifecycles')
		while (dynamicControllersLifecycles.size > 0) {
			await dynamicControllersLifecycles.values().next().value
		}
		removeUnfinishedTask()
		await waitForUpdatePropsPromises()

		if (process.env.browser) {
			// calling it here because we need to run all the applications, register the controllers APIs, run and finish all pageReady/onReady, before executing any static events handlers.
			// some handlers may depend on the apis being registered and onReady been called.
			await staticEventsManager.triggerStaticEventsHandlers()
			await compEventsManager.waitForEventsToBeRegistered()
		}
	}

	const appsState: {
		[appDefinitionId: string]: {
			viewerScriptUrl: string
			appModule: AppModule
			appParams: AppParams
			wixCodeApi: WixCodeApi
			platformAppServicesApi: PlatformServicesAPI
			platformApi: PlatformAPI
			platformApiProvider: PlatformApiProvider
			controllers: { [controllerCompId: string]: ControllerInstance }
			controllerPromises?: Array<Promise<ControllerInstance>>
			controllerModules?: ControllerModules // ModuleFederationManager
		}
	} = {}

	if (isEditorMode) {
		viewerHandlers.controllers.registerToRefreshControllers(
			async (updatedModel: Partial<Pick<PlatformModel, 'connections' | 'compIdConnections' | 'orderedControllers'>>, livePreviewOptions: Partial<LivePreviewOptions>) => {
				updatedModel.connections && modelsApi.updateConnections(updatedModel.connections)
				updatedModel.compIdConnections && modelsApi.updateCompIdConnections(updatedModel.compIdConnections)
				updatedModel.orderedControllers && modelsApi.updateOrderedControllers(updatedModel.orderedControllers)

				const appDefinitionIds = modelsApi.getApplicationIds().filter((appDefinitionId) => !livePreviewOptions?.apps || livePreviewOptions.apps.includes(appDefinitionId))
				await Promise.all(appDefinitionIds.map((appDefinitionId) => runAppControllers(appDefinitionId, livePreviewOptions)))
				return wixSelector.flushOnReadyCallbacks()
			}
		)
	}

	const _createRepeatedControllers = async (repeaterId: string, itemIds: Array<string>): Promise<void> => {
		const appToControllers = modelsApi.getRepeatedControllers(repeaterId) // {[appDefId]: appControllersInRepeater}

		if (_.isEmpty(appToControllers)) {
			return
		}

		await Promise.all(
			_.map(appToControllers, async (controllers, appDefinitionId) => {
				if (!appsState[appDefinitionId]) {
					return _.noop
				}
				const controllersData = _(controllers)
					.map((controller, controllerCompId) => {
						return itemIds.map((itemId) => {
							return {
								...controller,
								config: controllerConfigs[appDefinitionId][controllerCompId],
								context: createControllerItemContext(repeaterId, itemId),
							}
						})
					})
					.flatten()
					.value()

				const { appModule, appParams, wixCodeApi, platformAppServicesApi, platformApi, controllerModules, platformApiProvider } = appsState[appDefinitionId]
				const widgetsClientSpecMapData = clientSpecMapApi.getWidgetsClientSpecMapData(appDefinitionId)

				const controllersParams = createControllersParams(
					createSetPropsForOOI,
					controllersData,
					modelsApi.getAllConnections(),
					wixSelector,
					slotsManager,
					widgetsClientSpecMapData,
					appParams,
					wixCodeApi,
					platformAppServicesApi,
					platformApi,
					csrfToken,
					essentials,
					platformAppServicesApi.essentials,
					platformApiProvider,
					bootstrapData.platformEnvData.livePreviewOptions
				)

				controllersParams.forEach(({ controllerCompId }, index) => {
					const itemId = controllersData[index].context.itemId
					sdkInstancesCache.clearCacheByPredicate((compCacheParams) => compCacheParams.compId === controllerCompId && compCacheParams.itemId === itemId)
				})

				const controllerPromises = await logger.withReportingAndErrorHandling(
					'create_dynamic_controllers',
					async () => {
						return appModule.createControllers(
							controllersParams.map((item) => item.controllerParams),
							controllerModules!
						)
					},
					{ appDefinitionId }
				)

				if (!controllerPromises) {
					return
				}

				return Promise.all(
					controllerPromises.map(async (controllerPromise, index) => {
						const { controllerCompId, controllerParams } = controllersParams[index]
						const reportingParams = { appDefinitionId, controllerType: controllerParams.type, controllerCompId }
						const controller = await logger.withReportingAndErrorHandling('await_dynamic_controller_promise', () => controllerPromise, reportingParams)
						if (!controller) {
							await logger.reportAppError(
								{ name: 'Undefined controller', message: 'Controller returned from appModule.createControllers is undefined' } as Error,
								'controller_undefined',
								reportingParams
							)
							return
						}
						const itemId = controllersData[index].context.itemId
						controllersExports[getDisplayedId(controllerCompId, itemId)] = controller.exports
						const pageReadyFunc = () => Promise.resolve(controller.pageReady(controllerParams.$w, wixCodeApi))
						wixSelector.onPageReady(pageReadyFunc, controllerCompId, true)
						registerControllerHooks(controllerCompId, controllerParams, controller)
					})
				)
			})
		)
	}

	return {
		init: async () => {
			const appDefinitionIds = modelsApi.getApplicationIds()
			appsPublicApi.registerPublicApiProvider(runApplication)

			if (_.isEmpty(appDefinitionIds) || modelsApi.allControllersOnPageAreGhosts() || rawUrl.includes('disableAllPlatformApps')) {
				return
			}

			return logger.runAsyncAndReport('runApplications', () => runApplications(appDefinitionIds))
		},
		createRepeatedControllers: (repeaterId: string, itemIds: Array<string>) => {
			/*
				createRepeatedControllers must be a sync function (even if it returns a promise)
				so we can synchronously call dynamicControllers update dynamicControllersLifecycles.
				Otherwise we branch into another task and nested repeated controllers will not be waited for.
			 */
			const { promise, resolver } = createPromise()
			dynamicControllersLifecycles.add(promise)
			const removeUnfinishedTask = unfinishedTasks.add(`createRepeatedControllers_${repeaterId}`)
			return _createRepeatedControllers(repeaterId, itemIds).then(() => {
				return async () => {
					await wixSelector.flushOnReadyCallbacks()
					removeUnfinishedTask()
					dynamicControllersLifecycles.delete(promise)
					resolver()
				}
			})
		},
	}
}

export default {
	factory: Applications,
	deps: [
		APPS_PUBLIC_API,
		WIX_SELECTOR,
		MODELS_API,
		CLIENT_SPEC_MAP_API,
		APPS_URLS,
		BOOTSTRAP_DATA,
		IMPORT_SCRIPTS,
		WIX_CODE_VIEWER_APP_UTILS,
		BLOCKS_APPS_UTILS,
		DATA_BINDING_VIEWER_APP_UTILS,
		PLATFORM_LOGGER,
		WIX_CODE_API_FACTORY,
		SET_PROPS_MANAGER,
		CONTROLLERS_EXPORTS,
		PLATFORM_API,
		BSI_MANAGER,
		PLATFORM_UTILS,
		PLATFORM_ESSENTIALS,
		COMMON_CONFIG,
		VIEWER_HANDLERS,
		MODULE_FEDERATION_MANAGER,
		INSTANCE_CACHE,
		STATIC_EVENTS_MANAGER,
		REGISTER_EVENT,
		PLATFORM_API_PROVIDER,
		SLOTS_MANAGER,
		COMPONENT_SDKS_MANAGER,
		UNFINISHED_TASKS,
		DEBUG_API,
	],
	name: APPLICATIONS,
}
