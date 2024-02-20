import _ from 'lodash'
import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	CurrentRouteInfoSymbol,
	Experiments,
	ExperimentsSymbol,
	MasterPageFeatureConfigSymbol,
	SiteFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import type {
	ICurrentRouteInfo,
	IRoutingConfig,
	IRoutingLinkUtilsAPI,
	IUrlHistoryManager,
	RouterMasterPageConfig,
} from './types'
import { name, UrlHistoryManagerSymbol } from './symbols'
import { resolveUrl } from './resolveUrl'

export const RoutingLinkUtilsAPI = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		UrlHistoryManagerSymbol,
		CurrentRouteInfoSymbol,
		ExperimentsSymbol,
		named(MasterPageFeatureConfigSymbol, name),
	],
	(
		routingConfig: IRoutingConfig,
		urlHistoryManager: IUrlHistoryManager,
		currentRouteInfo: ICurrentRouteInfo,
		experiments: Experiments,
		masterPageConfig: RouterMasterPageConfig
	): IRoutingLinkUtilsAPI => {
		return {
			getLinkUtilsRoutingInfo() {
				const { pageId } =
					currentRouteInfo.getCurrentRouteInfo() ||
					resolveUrl(urlHistoryManager.getParsedUrl().href, routingConfig, {
						changeHashBangUrlFixExperimentOn: !!experiments['specs.thunderbolt.changeHashBangUrlFix'],
					})

				const { mainPageId, pagesMap, routes, pageIdToPrefix, baseUrl } = routingConfig
				return {
					mainPageId,
					pages: pagesMap,
					routes: _.omitBy(routes, (__, key) => key === './'),
					pageIdToPrefix,
					pageId: pageId!,
					relativeUrl: urlHistoryManager.getRelativeUrl(),
					externalBaseUrl: baseUrl,
					pagesUriSEOs: masterPageConfig.pagesUriSeoML.primaryToCurrentLang,
				}
			},
		}
	}
)
