import _ from 'lodash'
import { withDependencies, named, optional } from '@wix/thunderbolt-ioc'
import {
	TpaHandlerProvider,
	PageFeatureConfigSymbol,
	MasterPageFeatureConfigSymbol,
	SiteFeatureConfigSymbol,
	ExperimentsSymbol,
	Experiments,
} from '@wix/thunderbolt-symbols'
import { createLinkUtils } from '@wix/thunderbolt-commons'
import { TpaPageConfig, TpaMasterPageConfig } from '../types'
import { IRoutingLinkUtilsAPI, RoutingLinkUtilsAPISymbol } from 'feature-router'
import { ILightboxUtils, LightboxUtilsSymbol } from 'feature-lightbox'
import { name } from '../symbols'
import { TpaPageLinkData } from '@wix/thunderbolt-becky-types'
import { name as tpaCommonsName, TpaCommonsSiteConfig } from 'feature-tpa-commons'
import { IMultilingualLinkUtilsAPI, MultilingualLinkUtilsAPISymbol } from 'feature-multilingual'

export type MessageData = { sectionId: string; state: string }
export type HandlerResponse =
	| { url: string }
	| {
			error: {
				message: string
			}
	  }

export const GetStateUrlHandler = withDependencies(
	[
		named(SiteFeatureConfigSymbol, tpaCommonsName),
		named(PageFeatureConfigSymbol, name),
		named(MasterPageFeatureConfigSymbol, name),
		RoutingLinkUtilsAPISymbol,
		ExperimentsSymbol,
		optional(LightboxUtilsSymbol),
		optional(MultilingualLinkUtilsAPISymbol),
	],
	(
		tpaSiteConfig: TpaCommonsSiteConfig,
		tpaPageConfig: TpaPageConfig,
		tpaMasterPageConfig: TpaMasterPageConfig,
		routingLinkUtilsAPI: IRoutingLinkUtilsAPI,
		experiments: Experiments,
		lightboxUtils: ILightboxUtils,
		multilingualLinkUtilsAPI?: IMultilingualLinkUtilsAPI
	): TpaHandlerProvider => ({
		getTpaHandlers() {
			return {
				getStateUrl(compId, msgData: MessageData, { originCompId }): HandlerResponse {
					const {
						metaSiteId,
						userFileDomainUrl,
						routersConfig,
						appsClientSpecMapByApplicationId,
						appsClientSpecMapData,
						externalBaseUrl,
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
					const deprecateAppIdExperimentOn = experiments['specs.thunderbolt.deprecateAppId']

					const appIdToAppPagesIds = _(tpaMasterPageConfig.pagesData)
						.groupBy('tpaApplicationId')
						.mapValues((pages) => pages.map((page) => page.id))
						.value()

					const appDefIdToAppPagesIds = _(tpaMasterPageConfig.pagesData)
						.groupBy('appDefinitionId')
						.mapValues((pages) => pages.map((page) => page.id))
						.value()
					const pagesDataEntries = Object.entries(tpaMasterPageConfig.pagesData)
					const sectionIdToPageId = pagesDataEntries
						.map(([pageId, pageData]) => ({ [pageData.tpaPageId]: pageId }))
						.reduce(_.assign)

					const getAppDataByAppId = (_compId: string) => {
						const appId = tpaPageConfig.widgets[_compId].applicationId as string
						return {
							appData: appsClientSpecMapByApplicationId![appId],
							appPages: appIdToAppPagesIds[appId],
						}
					}
					const getAppDataByAppDefId = (_compId: string) => {
						const appDefId = tpaPageConfig.widgets[_compId].appDefinitionId
						return {
							appData: appsClientSpecMapData[appDefId],
							appPages: appDefIdToAppPagesIds[appDefId],
						}
					}

					const { state, sectionId } = msgData
					const { appData, appPages } = deprecateAppIdExperimentOn
						? getAppDataByAppDefId(originCompId)
						: getAppDataByAppId(originCompId)

					if (!appPages || appPages.length === 0) {
						return {
							error: {
								message: `Page with app "${appData.appDefinitionName}" was not found.`,
							},
						}
					}
					const sectionPageId = sectionIdToPageId[sectionId]
					const pageId = sectionPageId || appPages[0]
					const linkData = {
						type: 'TpaPageLink',
						pageId,
						path: state,
					} as TpaPageLinkData
					const linkUrl = linkUtils.getLinkUrlFromDataItem(linkData)

					return { url: `${externalBaseUrl}${linkUrl}` }
				},
			}
		},
	})
)
