import { withDependencies, named } from '@wix/thunderbolt-ioc'
import { TpaPageConfig } from '../types'
import {
	Experiments,
	ExperimentsSymbol,
	PageFeatureConfigSymbol,
	PublicData,
	TpaHandlerProvider,
} from '@wix/thunderbolt-symbols'
import { name } from '../symbols'
import _ from 'lodash'

export const GetPublicDataHandler = withDependencies(
	[named(PageFeatureConfigSymbol, name), ExperimentsSymbol],
	(tpaPageConfig: TpaPageConfig, experiments: Experiments): TpaHandlerProvider => {
		const deprecateAppIdExperimentOn = experiments['specs.thunderbolt.deprecateAppId']

		return {
			getTpaHandlers() {
				function getAllPublicData(originCompId: string): PublicData {
					const { widgets, appPublicData } = tpaPageConfig
					const { appDefinitionId, applicationId } = widgets[originCompId]
					const appPublicDataKey = deprecateAppIdExperimentOn ? appDefinitionId : applicationId
					return {
						APP: appPublicData[appPublicDataKey!],
						COMPONENT: widgets[originCompId].componentPublicData,
					}
				}
				return {
					getPublicData(compId, msgData, { originCompId }): PublicData {
						return getAllPublicData(originCompId)
					},
					getValues(compId, msgData, { originCompId }): any {
						const { scope, keys }: { scope: 'APP' | 'COMPONENT'; keys: Array<string> } = msgData
						const allPublicData = getAllPublicData(originCompId)
						return _.pickBy(allPublicData[scope], (value, key) => keys.includes(key))
					},
				}
			},
		}
	}
)
