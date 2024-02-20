import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { MasterPageFeatureConfigSymbol, SiteFeatureConfigSymbol } from '@wix/thunderbolt-symbols'
import { IRoutingConfig } from '.'
import { name } from './symbols'
import { IPagesMap, RouterMasterPageConfig } from './types'

const pagesMap = (
	routingConfig: IRoutingConfig,
	{ pagesUriSeoML: { languagesToPagesData } }: RouterMasterPageConfig
): IPagesMap => {
	return {
		getPageById: (pageId) => {
			return routingConfig.pagesMap[pageId]
		},
		getCurrentPageHierarchyMapping: (pageId: string, lang = 'primary') => {
			return languagesToPagesData[lang]?.[pageId] || languagesToPagesData.primary[pageId]
		},
	}
}

export const PagesMap = withDependencies(
	[named(SiteFeatureConfigSymbol, name), named(MasterPageFeatureConfigSymbol, name)],
	pagesMap
)
