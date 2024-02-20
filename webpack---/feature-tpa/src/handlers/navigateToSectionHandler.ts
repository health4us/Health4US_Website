import _ from 'lodash'
import { withDependencies, named, optional } from '@wix/thunderbolt-ioc'
import {
	TpaHandlerProvider,
	MasterPageFeatureConfigSymbol,
	SiteFeatureConfigSymbol,
	ExperimentsSymbol,
	Experiments,
} from '@wix/thunderbolt-symbols'
import { createLinkUtils } from '@wix/thunderbolt-commons'
import { INavigation, NavigationSymbol } from 'feature-navigation'
import { IRoutingLinkUtilsAPI, RoutingLinkUtilsAPISymbol } from 'feature-router'
import { ILightboxUtils, LightboxUtilsSymbol } from 'feature-lightbox'
import { CustomUrlMapperSymbol, ICustomUrlMapper, UrlMappingsKeys } from 'feature-custom-url-mapper'
import { BuildCustomizedUrlOptions } from '@wix/url-mapper-utils'
import { TpaPageLinkData } from '@wix/thunderbolt-becky-types'
import { PageTransitionsSymbol, IPageTransition } from 'feature-page-transitions'
import { ITpaSection, name as tpaCommonsName, TpaSectionSymbol, TpaCommonsSiteConfig } from 'feature-tpa-commons'
import { TpaMasterPageConfig } from '../types'
import { name } from '../symbols'
import { TPA_HANDLER_EMPTY_RESPONSE } from '../utils/constants'
import { IMultilingualLinkUtilsAPI, MultilingualLinkUtilsAPISymbol } from 'feature-multilingual'

export type MessageData = {
	sectionIdentifier?: {
		sectionId: string
		appDefinitionId?: string
		queryParams?: {
			[paramName: string]: string
		}
		state?: string
		noTransition?: boolean
		shouldRefreshIframe?: boolean
		customizeTarget?: {
			customUrlData?: {
				key: UrlMappingsKeys
				variables: Record<string, string>
				options: BuildCustomizedUrlOptions
			}
		}
	}
	state?: string
}

type AppDefIdIdToSectionIdToPageId = {
	[appDefId: string]: {
		[sectionId: string]: string
	}
}

class HandlerError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'HandlerError'
	}
}

export const NavigateToSectionHandler = withDependencies(
	[
		named(SiteFeatureConfigSymbol, tpaCommonsName),
		named(MasterPageFeatureConfigSymbol, name),
		NavigationSymbol,
		RoutingLinkUtilsAPISymbol,
		TpaSectionSymbol,
		ExperimentsSymbol,
		optional(LightboxUtilsSymbol),
		optional(MultilingualLinkUtilsAPISymbol),
		optional(PageTransitionsSymbol),
		optional(CustomUrlMapperSymbol),
	],
	(
		tpaSiteConfig: TpaCommonsSiteConfig,
		tpaMasterPageConfig: TpaMasterPageConfig,
		navigation: INavigation,
		routingLinkUtilsAPI: IRoutingLinkUtilsAPI,
		{ getTpaSectionByAppDefinitionId }: ITpaSection,
		experiments: Experiments,
		lightboxUtils: ILightboxUtils,
		multilingualLinkUtilsAPI: IMultilingualLinkUtilsAPI,
		pageTransition: IPageTransition,
		customUrlMapper?: ICustomUrlMapper
	): TpaHandlerProvider => {
		const pagesDataEntries = Object.entries(tpaMasterPageConfig.pagesData)

		const getNextPageId = ({ appDefinitionId, sectionId }: { appDefinitionId: string; sectionId?: string }) => {
			const appDefinitionIdToSectionIdToPageId = pagesDataEntries.reduce((acc, [pageId, pageData]) => {
				if (pageData.appDefinitionId) {
					if (!acc[pageData.appDefinitionId]) {
						acc[pageData.appDefinitionId] = {}
					}

					acc[pageData.appDefinitionId][pageData.tpaPageId] = pageId
				}

				return acc
			}, {} as AppDefIdIdToSectionIdToPageId)

			const appDefinitionIdToAppPagesIds = _(tpaMasterPageConfig.pagesData)
				.filter((pageData) => !!pageData.appDefinitionId)
				.groupBy('appDefinitionId')
				.mapValues((pages) => pages.map((page) => page.id))
				.value()

			const appData = tpaSiteConfig.appsClientSpecMapData[appDefinitionId]
			if (!appData) {
				throw new HandlerError(
					`Application with appDefinitionId "${appDefinitionId}" was not found on the site.`
				)
			}

			const nextAppPages = appDefinitionIdToAppPagesIds[appDefinitionId]
			if (!nextAppPages || nextAppPages.length === 0) {
				throw new HandlerError(`Page with app "${appData.appDefinitionName}" was not found.`)
			}

			const sectionPageId = sectionId ? appDefinitionIdToSectionIdToPageId[appDefinitionId][sectionId] : null

			if (sectionId && !sectionPageId) {
				throw new HandlerError(`App page with sectionId "${sectionId}" was not found.`)
			}

			const nextPageId = sectionPageId || nextAppPages[0]
			return nextPageId
		}

		const resolveCustomUrl = async (msgData: MessageData): Promise<string | void> => {
			const urlMappings = customUrlMapper?.urlMappings

			if (urlMappings) {
				const { buildCustomizedUrl } = await import(
					'@wix/url-mapper-utils' /* webpackChunkName: "url-mapper-utils" */
				)
				const { key, variables, options } = msgData?.sectionIdentifier?.customizeTarget?.customUrlData || {}
				if (key && variables) {
					return buildCustomizedUrl(urlMappings, key as UrlMappingsKeys, variables, options)
				}
			}
		}

		return {
			getTpaHandlers: () => ({
				// https://dev.wix.com/api/iframe-sdk/sdk/wix.utils#sdk_wix.utils_navigatetosection
				async navigateToSectionPage(
					_compId: string,
					msgData: MessageData,
					{ appDefinitionId: callerAppDefinitionId }
				) {
					const {
						metaSiteId,
						userFileDomainUrl,
						routersConfig,
						isMobileView,
						isPremiumDomain,
					} = tpaSiteConfig

					const linkUtils = createLinkUtils({
						routingInfo: routingLinkUtilsAPI.getLinkUtilsRoutingInfo(),
						metaSiteId,
						userFileDomainUrl,
						routersConfig,
						popupPages: lightboxUtils?.getLightboxPages(),
						multilingualInfo: multilingualLinkUtilsAPI?.getMultilingualInfo(),
						isMobileView,
						isPremiumDomain,
						experiments,
					})

					const {
						sectionIdentifier: {
							sectionId,
							noTransition = false,
							queryParams = {},
							appDefinitionId: appDefinitionIdFromSectionIdentifier,
							state: stateFromSectionIdentifier,
						} = {},
						state: stateFromRoot,
					} = msgData

					const appDefinitionId = appDefinitionIdFromSectionIdentifier || callerAppDefinitionId
					if (!appDefinitionId) {
						throw new HandlerError('Component was not found.')
					}

					const state = stateFromRoot || stateFromSectionIdentifier

					let nextPageId: string = ''
					try {
						nextPageId = getNextPageId({ appDefinitionId, sectionId })
					} catch (e) {
						if (e instanceof HandlerError) {
							return {
								error: {
									message: e.message,
								},
							}
						}

						throw e
					}

					const linkData = {
						type: 'TpaPageLink',
						pageId: nextPageId,
						path: state!,
					} as TpaPageLinkData

					const linkUrl = (await resolveCustomUrl(msgData)) || linkUtils.getLinkUrlFromDataItem(linkData)

					const queryParamsUrl = _.isEmpty(queryParams)
						? ''
						: `?appSectionParams=${encodeURIComponent(JSON.stringify(queryParams))}`
					const url = `${linkUrl}${queryParamsUrl}`

					const linkProps = linkUtils.getLinkProps(url)

					if (noTransition && pageTransition) {
						pageTransition.disableNextTransition()
					}

					const didNavigate = await navigation.navigateTo(linkProps)
					if (!didNavigate) {
						console.warn(
							'You have invoked the navigateToSectionPage() API but you are already on the section page. Please use the pushState() API instead.'
						)

						if (msgData.sectionIdentifier?.shouldRefreshIframe === false) {
							// explicit false
							return TPA_HANDLER_EMPTY_RESPONSE
						}
						// the application's section might be on a different container, this api grab an instance of it wherever it is
						const tpaSection = getTpaSectionByAppDefinitionId(appDefinitionId)
						if (tpaSection) {
							tpaSection.rebuildSrc()
						}
					}

					return TPA_HANDLER_EMPTY_RESPONSE
				},
			}),
		}
	}
)
