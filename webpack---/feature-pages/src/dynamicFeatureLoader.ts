import { DynamicLoadFeature, FeatureName, InitSymbol, pageIdSym } from '@wix/thunderbolt-symbols'
import { IocContainer, ProviderCreator } from '@wix/thunderbolt-ioc'
import { ILoadFeatures, FeaturesLoaderSymbol } from '@wix/thunderbolt-features'
import { IPageFeatureLoader } from './types'

export const pageFeatureLoader: ProviderCreator<IPageFeatureLoader> = (pageContainer: IocContainer) => {
	const featuresLoader = pageContainer.get<ILoadFeatures>(FeaturesLoaderSymbol)

	return () => {
		return {
			loadFeature: async <T>(featureName: FeatureName, symbol: symbol): Promise<T & DynamicLoadFeature> => {
				const pageId = pageContainer.get<string>(pageIdSym)

				const existingApi = pageContainer.get<T & DynamicLoadFeature>(symbol)
				if (existingApi) {
					return existingApi
				}

				await featuresLoader.loadPageFeatures(pageContainer, [featureName])

				const featureInitializers = pageContainer.getAllNamed<T & DynamicLoadFeature>(InitSymbol, featureName)

				await Promise.all(featureInitializers.map(({ init }) => init(pageId)))

				return pageContainer.get<T & DynamicLoadFeature>(symbol)
			},
		}
	}
}
