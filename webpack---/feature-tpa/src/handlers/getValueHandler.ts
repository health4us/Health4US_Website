import { withDependencies, named } from '@wix/thunderbolt-ioc'
import { TpaPageConfig } from '../types'
import { Experiments, ExperimentsSymbol, PageFeatureConfigSymbol, TpaHandlerProvider } from '@wix/thunderbolt-symbols'
import { name } from '../symbols'

export type MessageData = {
	key: string
	scope: 'APP' | 'COMPONENT'
}

export const GetValueHandler = withDependencies(
	[named(PageFeatureConfigSymbol, name), ExperimentsSymbol],
	(tpaPageConfig: TpaPageConfig, experiments: Experiments): TpaHandlerProvider => ({
		getTpaHandlers() {
			const deprecateAppIdExperimentOn = experiments['specs.thunderbolt.deprecateAppId']
			return {
				getValue(compId, { key, scope }: MessageData, { originCompId }) {
					const { widgets, appPublicData } = tpaPageConfig
					const { appDefinitionId, applicationId } = widgets[originCompId]
					const appPublicDataKey = deprecateAppIdExperimentOn ? appDefinitionId : applicationId

					const parsedData =
						scope === 'APP' ? appPublicData[appPublicDataKey!] : widgets[originCompId].componentPublicData
					if (!(parsedData && parsedData[key])) {
						return { error: { message: `key ${key} not found in ${scope} scope` } }
					}
					return { [key]: parsedData[key] }
				},
			}
		},
	})
)
