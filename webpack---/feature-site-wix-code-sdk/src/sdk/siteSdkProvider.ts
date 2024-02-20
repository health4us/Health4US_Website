import { optional, withDependencies } from '@wix/thunderbolt-ioc'
import { SdkHandlersProvider, DynamicPagesSymbol } from '@wix/thunderbolt-symbols'

import { DynamicPagesAPI } from 'feature-router'
import { SiteWixCodeSdkHandlers } from '../types'
import { IPageProvider, PageProviderSymbol } from 'feature-pages'

export const siteSdkProvider = withDependencies(
	[optional(DynamicPagesSymbol), PageProviderSymbol],
	(dynamicPagesAPI: DynamicPagesAPI, pageProvider: IPageProvider): SdkHandlersProvider<SiteWixCodeSdkHandlers> => ({
		getSdkHandlers: () => ({
			getSitemapFetchParams: (routePrefix) => {
				if (!dynamicPagesAPI) {
					return null
				}

				return dynamicPagesAPI.getSitemapFetchParams(routePrefix)
			},
			prefetchPagesResources: (pagesIds: Array<string>) => {
				pagesIds.map((pageId) => pageProvider(pageId, pageId))
			},
		}),
	})
)
