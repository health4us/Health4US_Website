import { optional, withDependencies } from '@wix/thunderbolt-ioc'
import {
	Component,
	IAppDidMountHandler,
	ILogger,
	IPerfReporterApi,
	IStructureAPI,
	LoggerSymbol,
	PerfReporterSymbol,
	Structure,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import { FeaturesLoaderSymbol, ILoadFeatures } from '@wix/thunderbolt-features'
import { OOICompDataSymbol, IOOICompData } from 'feature-ooi-tpa-shared-config'
import { getClosestCompIdByHtmlElement, extractClosestCompTypeFromHtmlElement, isSSR } from '@wix/thunderbolt-commons'

export default withDependencies<IAppDidMountHandler>(
	[
		FeaturesLoaderSymbol,
		ViewerModelSym,
		LoggerSymbol,
		Structure,
		optional(PerfReporterSymbol),
		optional(OOICompDataSymbol),
	],
	(
		featuresLoader: ILoadFeatures,
		viewerModel: ViewerModel,
		logger: ILogger,
		structureApi: IStructureAPI,
		perfReporter?: IPerfReporterApi,
		ooiCompData?: IOOICompData
	) => ({
		appDidMount: async () => {
			try {
				if (perfReporter) {
					const getCompDataByHtmlElement = (element: HTMLElement) => {
						const compId = getClosestCompIdByHtmlElement(element)
						if (!compId) {
							const compType = extractClosestCompTypeFromHtmlElement(element)
							return { compType: compType || 'not_found' }
						}
						// When navigating, sometimes the onINP is being sent after the structure was updated but before the page was rendered.
						// This means we successfully extract the compId from the html, but the component is no longer in the structure.
						const compData = structureApi.get(compId) as Component | undefined
						const basicData = { compType: compData?.componentType || 'comp_not_found_in_structure' }
						if (compData?.componentType === 'tpaWidgetNative') {
							const ooiData = ooiCompData?.getCompDataByCompId(compId)
							return {
								widgetId: ooiData?.widgetId,
								appDefinitionId: ooiData?.appDefinitionId,
								...basicData,
							}
						}
						return basicData
					}
					if (!isSSR(window) && (process.env.NODE_ENV !== 'production' || viewerModel.mode.debug)) {
						// @ts-ignore
						window._getCompDataByHtmlElement = getCompDataByHtmlElement
					}

					perfReporter.update({ getHtmlElementMetadata: getCompDataByHtmlElement })
				}

				const features = [...featuresLoader.getLoadedPageFeatures(), ...viewerModel.siteFeatures]
				const components = Object.values(structureApi.getEntireStore()).map((item) => item.componentType)
				logger.meter(`page_features_loaded`, {
					customParams: {
						features,
						components,
					},
				})
			} catch {}
		},
	})
)
