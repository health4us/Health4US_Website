import { ContainerModuleLoader, withDependencies } from '@wix/thunderbolt-ioc'
import {
	CurrentRouteInfoSymbol,
	DynamicFeatureLoader,
	FeatureName,
	IPageFeatureLoader,
	LifeCycle,
	PageFeatureLoaderSym,
	PageInfo,
} from '@wix/thunderbolt-symbols'
import {
	LogicalReflectorSymbol,
	PageProviderSymbol,
	PageStructureJsonSymbol,
	PagePropsJsonSymbol,
	PageInitializerSymbol,
} from './symbols'
import type { IPageProvider, IPageReflector, IPageInitializer, IPageFeatureLoaderProvider } from './types'
import { PageProvider } from './PageReflector'
import { LogicalReflector } from './logicalReflector'
import PageBiReporting from './pageBiReporting'
import { PageInitializer } from './pageInitializer'
import type { ICurrentRouteInfo } from '@wix/thunderbolt-symbols'

const dynamicFeatureLoader = withDependencies(
	[PageProviderSymbol, CurrentRouteInfoSymbol],
	(pageProvider: IPageProvider, currentRouteInfo: ICurrentRouteInfo): IPageFeatureLoader => {
		return {
			loadFeature: async <T>(featureName: FeatureName, symbol: symbol, pageInfo?: PageInfo) => {
				const pageInfoToLoad = pageInfo || currentRouteInfo.getCurrentRouteInfo()
				if (pageInfoToLoad) {
					const currentPageReflector = await pageProvider(pageInfoToLoad.contextId, pageInfoToLoad.pageId)
					const [
						pageDynamicLoader,
					] = currentPageReflector.getAllImplementersOnPageOf<IPageFeatureLoaderProvider>(
						PageFeatureLoaderSym
					)
					return pageDynamicLoader().loadFeature<T>(featureName, symbol)
				}
				// TODO: validate what todo here
				throw new Error('No pageId found in currentRouteInfo')
			},
		}
	}
)

export const site: ContainerModuleLoader = (bind) => {
	bind<IPageProvider>(PageProviderSymbol).toProvider<IPageReflector>(PageProvider)
	bind(LogicalReflectorSymbol).toProvider<IPageReflector>(LogicalReflector)
	bind(LifeCycle.AppDidMountHandler).to(PageBiReporting)
	bind(DynamicFeatureLoader).to(dynamicFeatureLoader)
	bind(PageInitializerSymbol).to(PageInitializer)
}

export {
	PageProviderSymbol,
	LogicalReflectorSymbol,
	PageStructureJsonSymbol,
	PagePropsJsonSymbol,
	IPageProvider,
	IPageReflector,
	IPageInitializer,
	PageInitializerSymbol,
}
