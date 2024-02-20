import _ from 'lodash'
import { EventCategories } from '@wix/fe-essentials-viewer-platform/bi'
import type { BiUtils, Initializable, IModelsAPI, IPlatformLogger } from '@wix/thunderbolt-symbols'
import type { BootstrapData } from '../../types'
import { PLATFORM_BI, PLATFORM_BI_LOGGER, BOOTSTRAP_DATA, MODELS_API, PLATFORM_LOGGER } from './moduleNames'

const PlatformBi = (platformBiLogger: BiUtils, platformLogger: IPlatformLogger, bootstrapData: BootstrapData, modelsApi: IModelsAPI): Initializable => ({
	init: () => {
		const {
			platformEnvData: {
				bi: {
					isPreview,
					pageData: { pageNumber, isLightbox },
				},
			},
		} = bootstrapData

		if (process.env.browser && !isLightbox && !isPreview) {
			const all_widgets = _.flatMap(modelsApi.getApplications(), (controllers) => _.map(controllers, 'controllerType'))
			const widgets_ids = _.uniq(all_widgets)
			const slotsToWidgets = modelsApi.getSlotsToWidgets()
			const params = all_widgets.length
				? {
						apps_ids: modelsApi.getApplicationIds(),
						widgets_ids,
						slotsToWidgets,
						widgets_count: all_widgets.length,
						pageNumber,
						hasBlocksWidget: modelsApi.hasBlocksWidgetOnPage(),
				  }
				: {
						apps_ids: ['NO_APPS'],
						widgets_ids: ['NO_APPS'],
						widgets_count: 0,
						pageNumber,
						hasBlocksWidget: false,
				  }

			platformBiLogger
				.createBaseBiLoggerFactory()
				.logger()
				.log(
					{
						src: 72,
						evid: 520,
						...params,
					},
					{
						endpoint: 'bpm',
						category: EventCategories.Essential,
					}
				)
		}

		_.forEach(modelsApi.getApplications(), (controllers, appDefinitionId) => {
			_.forEach(controllers, ({ controllerType }, controllerCompId) => {
				platformLogger.reportWidgetWillLoad(appDefinitionId, controllerType, controllerCompId)
			})
		})
	},
})

export default {
	factory: PlatformBi,
	deps: [PLATFORM_BI_LOGGER, PLATFORM_LOGGER, BOOTSTRAP_DATA, MODELS_API],
	name: PLATFORM_BI,
}
