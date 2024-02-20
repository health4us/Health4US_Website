import { IFeatureState } from 'thunderbolt-feature-state'
import { LoginTypes, ProtectedPagesSiteConfig } from './types'
import type { ProtectedPagesState, PagesMap, ProtectedPageMasterPageConfig } from './types'
import { CandidateRouteInfo, ICurrentRouteInfo, IRouter, Router } from 'feature-router'
import { AuthenticationResult, ISiteMembersApi, SiteMembersApiSymbol, AUTH_RESULT_REASON } from 'feature-site-members'
import { PasswordProtectedPageApiSymbol, IPasswordProtectedPageApi } from 'feature-password-protected-page'
import { SeoSiteSymbol, ISeoSiteApi } from 'feature-seo'
import {
	ILogger,
	IAppWillMountHandler,
	FeatureStateSymbol,
	LoggerSymbol,
	MasterPageFeatureConfigSymbol,
	CurrentRouteInfoSymbol,
	Experiments,
	ExperimentsSymbol,
	SiteFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import { withDependencies, named, optional } from '@wix/thunderbolt-ioc'
import { name } from './symbols'

const protectedPagesLoginAndNavigate = (
	featureState: IFeatureState<ProtectedPagesState>,
	{ publicPageIds, pageUriSeoToRouterPrefix }: ProtectedPagesSiteConfig,
	{ customNoPermissionsPageUriSeo, customNoPermissionsPageId }: ProtectedPageMasterPageConfig,
	router: IRouter,
	currentRouteInfo: ICurrentRouteInfo,
	siteMembersApi: ISiteMembersApi,
	passwordProtectedPageApi: IPasswordProtectedPageApi,
	seoApi: ISeoSiteApi,
	logger: ILogger,
	experiments: Experiments
): IAppWillMountHandler => {
	const doSiteMembersLogin = async () => {
		let result
		if (siteMembersApi) {
			if (experiments['specs.thunderbolt.newAuthorizedPagesFlow']) {
				result = await siteMembersApi.requestAuthorizedPages()
				if (result.success) {
					return {
						// the version of TS on CI doesn't recognize that if `result.success` is true
						// then `result.pages` is of the correct type. Hopefully we can remove this
						// ignore soon
						// @ts-ignore
						authorizedPagesMap: result.pages,
						onProtectedPageNavigationComplete: async () => {
							if (process.env.browser) {
								// reset the title
								window.document.title = await seoApi.getPageTitle()
							}
						},
					}
				}
			} else {
				result = await siteMembersApi.requestAuthentication({})
				if (result.success) {
					return {
						authorizedPagesMap: await siteMembersApi.authorizeMemberPagesByToken(result.token!),
					}
				}
			}
		}

		return { authorizedPagesMap: {}, authenticationResult: result }
	}

	const doPasswordEnter = async (pageId: string) => {
		if (passwordProtectedPageApi) {
			return passwordProtectedPageApi.promptPagePasswordDialog(pageId)
		}

		return {
			authorizedPagesMap: {},
		}
	}

	const doLogin = async (
		loginType: LoginTypes,
		pageId: string
	): Promise<{
		authorizedPagesMap: PagesMap
		authenticationResult?: AuthenticationResult
		onProtectedPageNavigationComplete?: () => void
	}> => {
		return loginType === LoginTypes.SM ? doSiteMembersLogin() : doPasswordEnter(pageId)
	}

	const navigateToPageWithNoPermissions = async (
		routeInfo: Partial<CandidateRouteInfo>,
		loginType: LoginTypes,
		isCustomNoPermissionsAllowed: boolean = false
	): Promise<boolean> => {
		if (customNoPermissionsPageUriSeo && isCustomNoPermissionsAllowed) {
			const routerPrefix = pageUriSeoToRouterPrefix[customNoPermissionsPageUriSeo]
				? `./${pageUriSeoToRouterPrefix[customNoPermissionsPageUriSeo]}/`
				: './'
			const customNoPermissionsPageUrl = `${routerPrefix}${customNoPermissionsPageUriSeo}`
			return router.navigate(
				`${customNoPermissionsPageUrl}?appSectionParams=${JSON.stringify({
					restrictedPageId: routeInfo.pageId!,
					restrictedPagePath: (routeInfo.relativeEncodedUrl ?? '').replace('./', '/'),
				})}`
			)
		}
		if (siteMembersApi && loginType === 'SM') {
			const onCloseCallback = () => {
				if (currentRouteInfo.isLandingOnProtectedPage()) {
					router.navigate('./')
				}
			}
			siteMembersApi.showNoPermissionsToPageDialog(onCloseCallback)
			return false
		}

		return currentRouteInfo.isLandingOnProtectedPage() ? router.navigate('./') : false
	}

	async function authenticateUsingSitePassword(routeInfo: Partial<CandidateRouteInfo>) {
		if (!passwordProtectedPageApi) {
			return
		}

		const { authorizedPagesMap, onComplete } = await passwordProtectedPageApi.promptSitePasswordDialog()

		featureState.update((state) => ({
			...state,
			pagesMap: Object.assign(state.pagesMap, authorizedPagesMap),
			completedSitePasswordAuth: true,
		}))

		await router.navigate(routeInfo.parsedUrl!.href)
		onComplete?.()
	}

	const loginAndNavigate: ProtectedPagesState['loginAndNavigate'] = async (routeInfo, loginType) => {
		const pageId = routeInfo.pageId!
		try {
			const { authorizedPagesMap, authenticationResult, onProtectedPageNavigationComplete } = await doLogin(
				loginType,
				pageId
			)
			featureState.update((state) => ({
				...state,
				pagesMap: Object.assign(state.pagesMap, authorizedPagesMap),
			}))

			if (authenticationResult?.reason === AUTH_RESULT_REASON.CANCELED) {
				return currentRouteInfo.isLandingOnProtectedPage() ? router.navigate('./') : false
			}

			if (authorizedPagesMap[pageId]) {
				const didNavigate = await router.navigate(routeInfo.parsedUrl!.href)
				onProtectedPageNavigationComplete?.()
				return didNavigate
			} else {
				const isCustomNoPermissionsPagePublic = publicPageIds.includes(customNoPermissionsPageId)
				const isUserAuthorizedForCustomNoPermissionsPage = Boolean(
					featureState.get().pagesMap[customNoPermissionsPageId]
				)
				const isCustomNoPermissionsPageAllowed =
					isCustomNoPermissionsPagePublic || isUserAuthorizedForCustomNoPermissionsPage

				return navigateToPageWithNoPermissions(routeInfo, loginType, isCustomNoPermissionsPageAllowed)
			}
		} catch (err) {
			logger.captureError(err, { tags: { feature: 'protectedPage' } })
			return navigateToPageWithNoPermissions(routeInfo, loginType)
		}
	}

	featureState.update(() => ({
		loginAndNavigate,
		authenticateUsingSitePassword,
		completedSitePasswordAuth: false,
		pagesMap: {},
	}))

	return {
		appWillMount: async () => {},
	}
}

export const ProtectedPagesAppWillMountHandler = withDependencies(
	[
		named(FeatureStateSymbol, name),
		named(SiteFeatureConfigSymbol, name),
		named(MasterPageFeatureConfigSymbol, name),
		Router,
		CurrentRouteInfoSymbol,
		optional(SiteMembersApiSymbol),
		optional(PasswordProtectedPageApiSymbol),
		SeoSiteSymbol,
		LoggerSymbol,
		ExperimentsSymbol,
	],
	protectedPagesLoginAndNavigate
)
