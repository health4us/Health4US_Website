import { withDependencies } from '@wix/thunderbolt-ioc'
import { PageStyleLoaderSymbol } from './symbols'
import { ILoadPageStyle } from './PageStyleLoader'
import {
	IPageAssetsLoader,
	IPageResourceFetcher,
	PageAssets,
	PageResourceFetcherSymbol,
	SiteAssetsResources,
} from '@wix/thunderbolt-symbols'

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T

const createPageAssetsExtractor = (pageFeatures: Promise<SiteAssetsResources['features']>) => <
	K extends keyof PageAssets
>(
	extractor: (result: ThenArg<SiteAssetsResources['features']>) => ThenArg<PageAssets[K]>
) => pageFeatures.then((result) => extractor(result))

const pageAssetsLoaderImplFactory: (
	pageResourceFetcher: IPageResourceFetcher,
	pageStyleLoader: ILoadPageStyle
) => IPageAssetsLoader = (pageResourceFetcher, pageStyleLoader) => {
	const assetsCache: Record<string, PageAssets> = {}

	const createPageAssets = (pageCompId: string): PageAssets => {
		const addCssPromise = pageStyleLoader.load(pageCompId)
		const pageFeatures = pageResourceFetcher.fetchResource(pageCompId, 'features')

		const extractByPageAssetType = createPageAssetsExtractor(pageFeatures)
		return {
			components: extractByPageAssetType<'components'>(({ structure: { components } }) => components),
			features: extractByPageAssetType<'features'>(({ structure: { features } }) => features),
			siteFeaturesConfigs: extractByPageAssetType<'siteFeaturesConfigs'>(
				({ structure: { siteFeaturesConfigs } }) => siteFeaturesConfigs
			),
			props: extractByPageAssetType<'props'>(({ props }) => props),
			stateRefs: extractByPageAssetType<'stateRefs'>(({ stateRefs }) => stateRefs),
			css: addCssPromise,
		}
	}

	return {
		load: (pageCompId: string) => {
			assetsCache[pageCompId] = assetsCache[pageCompId] || createPageAssets(pageCompId)
			return assetsCache[pageCompId]
		},
	}
}

export const PageAssetsLoaderImpl = withDependencies(
	[PageResourceFetcherSymbol, PageStyleLoaderSymbol],
	pageAssetsLoaderImplFactory
)
