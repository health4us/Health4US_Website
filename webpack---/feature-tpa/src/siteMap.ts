import { named, optional, withDependencies } from '@wix/thunderbolt-ioc'
import {
	Experiments,
	ExperimentsSymbol,
	IPageResourceFetcher,
	PageResourceFetcherSymbol,
	SiteFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import { name as tpaCommonsName, TpaCommonsSiteConfig } from 'feature-tpa-commons'
import { IRoutingLinkUtilsAPI, RoutingLinkUtilsAPISymbol } from 'feature-router'
import { ILightboxUtils, LightboxUtilsSymbol } from 'feature-lightbox'
import { IMultilingualLinkUtilsAPI, MultilingualLinkUtilsAPISymbol } from 'feature-multilingual'
import { getSiteMap } from './utils/siteMap'
import type { ISiteMap } from './types'

export const SiteMap = withDependencies(
	[
		named(SiteFeatureConfigSymbol, tpaCommonsName),
		RoutingLinkUtilsAPISymbol,
		PageResourceFetcherSymbol,
		ExperimentsSymbol,
		optional(LightboxUtilsSymbol),
		optional(MultilingualLinkUtilsAPISymbol),
	],
	(
		tpaCommonsSiteConfig: TpaCommonsSiteConfig,
		routingLinkUtilsAPI: IRoutingLinkUtilsAPI,
		pageResourceFetcher: IPageResourceFetcher,
		experiments: Experiments,
		lightboxUtils: ILightboxUtils,
		multilingualLinkUtilsAPI?: IMultilingualLinkUtilsAPI
	): ISiteMap => ({
		getSiteMap: async () => {
			const siteMapItems = await pageResourceFetcher.fetchResource('masterPage', 'siteMap')
			return getSiteMap(
				siteMapItems,
				tpaCommonsSiteConfig,
				routingLinkUtilsAPI,
				lightboxUtils,
				experiments,
				multilingualLinkUtilsAPI
			)
		},
	})
)
