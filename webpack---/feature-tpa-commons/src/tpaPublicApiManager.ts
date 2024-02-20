import { optional, withDependencies } from '@wix/thunderbolt-ioc'
import type { IAppWillLoadPageHandler } from '@wix/thunderbolt-symbols'
import { createPromise, loadPmRpc } from '@wix/thunderbolt-commons'
import {
	PlatformWorkerPromise,
	PlatformWorkerPromiseSym,
	PublicAPI,
	SdkHandlersProvider,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import type { AppsPublicApisGetter, ITpaPublicApiManager, PublicApiTpaSdkHandlers } from './types'

export const TpaPublicApiManager = withDependencies(
	[ViewerModelSym, optional(PlatformWorkerPromiseSym)],
	(
		{ siteAssets, mode: { debug } }: ViewerModel,
		platformWorkerPromiseObj: {
			platformWorkerPromise: PlatformWorkerPromise
		}
	): IAppWillLoadPageHandler & ITpaPublicApiManager & SdkHandlersProvider<PublicApiTpaSdkHandlers> => {
		let waitForAppsPublicApiGetter = createPromise<AppsPublicApisGetter>()
		let waitForPublicApiReadyPromise: Promise<void> | null = null

		const waitForPublicApiReady = async () => {
			if (debug) {
				console.warn(
					'getPublicApi() has high performance overhead as we download and execute all apps on site. consider mitigating this by e.g migrating to Wix Blocks or OOI.'
				)
			}

			const [pmRpc, worker, getPublicApiNames] = await Promise.all([
				loadPmRpc(siteAssets.clientTopology.moduleRepoUrl),
				platformWorkerPromiseObj.platformWorkerPromise as Promise<Worker>,
				waitForAppsPublicApiGetter.promise,
			])

			const appsPublicApisNames = await getPublicApiNames()

			if (!appsPublicApisNames.length) {
				const errorMessage = 'getPublicApi() rejected since there are no platform apps on page'
				if (debug) {
					console.warn(errorMessage)
				}
				throw new Error(errorMessage)
			}

			await Promise.all(
				appsPublicApisNames.map((appName: string) =>
					pmRpc.api.request(appName, { target: worker }).then((publicAPI: PublicAPI) => {
						pmRpc.api.set(appName, publicAPI)
					})
				)
			)
		}

		return {
			name: 'tpaPublicApiManager',
			appWillLoadPage() {
				waitForAppsPublicApiGetter = createPromise<AppsPublicApisGetter>()
				waitForPublicApiReadyPromise = null
			},
			waitForPublicApiReady() {
				if (!waitForPublicApiReadyPromise) {
					waitForPublicApiReadyPromise = waitForPublicApiReady()
				}
				return waitForPublicApiReadyPromise
			},
			getSdkHandlers() {
				return {
					publicApiTpa: {
						registerPublicApiGetter: (appsPublicApisGetter: AppsPublicApisGetter) => {
							waitForAppsPublicApiGetter.resolver(appsPublicApisGetter)
						},
					},
				}
			},
		}
	}
)
