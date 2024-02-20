import { named, withDependencies } from '@wix/thunderbolt-ioc'
import type { ISessionProvider, SessionManagerSiteConfig } from './types'
import { DynamicModelSymbol, Fetch, LoggerSymbol, SiteFeatureConfigSymbol } from '@wix/thunderbolt-symbols'
import type { IFetchApi, ILogger, DynamicSessionModel } from '@wix/thunderbolt-symbols'
import { name } from './symbols'

export const ClientSessionProvider = withDependencies(
	[DynamicModelSymbol, named(SiteFeatureConfigSymbol, name), Fetch, LoggerSymbol],
	(
		dynamicModel: DynamicSessionModel,
		siteFeatureConfig: SessionManagerSiteConfig,
		fetchApi: IFetchApi,
		logger: ILogger
	): ISessionProvider => {
		let currentSession: Partial<DynamicSessionModel> = dynamicModel

		return {
			getCurrentSession: () => currentSession,
			loadNewSession: async ({ authorizationCode }) => {
				try {
					const res = await fetchApi.envFetch(siteFeatureConfig.dynamicModelApiUrl, {
						credentials: 'same-origin',
						...(authorizationCode && { headers: { authorization: authorizationCode } }),
					})

					if (!res.ok) {
						throw new Error(`[${res.status}]${res.statusText}`)
					}

					currentSession = await res.json()
					return currentSession
				} catch (error) {
					logger.captureError(new Error(`failed fetching dynamicModel`), {
						tags: { feature: 'session-manager', fetchFail: 'dynamicModel' },
						extra: { errorMessage: error.message },
					})
					throw error
				}
			},
		}
	}
)
