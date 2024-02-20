import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { FeatureStateSymbol, MasterPageFeatureConfigSymbol, SiteFeatureConfigSymbol } from '@wix/thunderbolt-symbols'
import { name } from './symbols'
import { IRoutingMiddleware } from 'feature-router'
import type { ProtectedPageMasterPageConfig, ProtectedPagesSiteConfig, ProtectedPagesState } from './types'
import { LoginTypes } from './types'
import { IFeatureState } from 'thunderbolt-feature-state'

const sendError = (pageId: string, pageSecurity?: ProtectedPageMasterPageConfig['pagesSecurity'][string]) => {
	throw new Error(`we do not have authentication info for protected page ${pageId} page security: ${pageSecurity}`)
}

const protectedPagesClientRoutingHandler = (
	masterPageConfig: ProtectedPageMasterPageConfig,
	siteConfig: ProtectedPagesSiteConfig,
	featureState: IFeatureState<ProtectedPagesState>
): IRoutingMiddleware => {
	const whichLogin = (pageId: string): LoginTypes => {
		const pageSecurity = masterPageConfig.pagesSecurity[pageId]
		if (pageSecurity && pageSecurity.requireLogin) {
			return LoginTypes.SM
		}
		if (siteConfig.passwordProtected[pageId] || (pageSecurity && !!pageSecurity.passwordDigest)) {
			return LoginTypes.Pass
		}
		return LoginTypes.NONE
	}

	return {
		async handle(routeInfo) {
			if (routeInfo.pageJsonFileName) {
				return routeInfo
			}

			const pageId = routeInfo.pageId!
			const {
				pagesMap,
				loginAndNavigate,
				authenticateUsingSitePassword,
				completedSitePasswordAuth,
			} = featureState.get()

			if (pagesMap[pageId]) {
				return {
					...routeInfo,
					pageJsonFileName: pagesMap[pageId],
				}
			}

			if (whichLogin('masterPage') === LoginTypes.Pass && !completedSitePasswordAuth) {
				authenticateUsingSitePassword(routeInfo)
				return null
			}

			const loginType = whichLogin(pageId)
			if (loginType === LoginTypes.NONE) {
				sendError(pageId, masterPageConfig.pagesSecurity[pageId])
			}

			loginAndNavigate(routeInfo, loginType)

			return null
		},
	}
}

export const ProtectedPagesClientRoutingHandler = withDependencies(
	[named(MasterPageFeatureConfigSymbol, name), named(SiteFeatureConfigSymbol, name), named(FeatureStateSymbol, name)],
	protectedPagesClientRoutingHandler
)
