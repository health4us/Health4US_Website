import _ from 'lodash'
import type { Experiments, PlatformBootstrapData, PlatformEnvData } from '@wix/thunderbolt-symbols'
import type { BootstrapData } from '../types'

export function createBootstrapData({
	platformBootstrapData,
	siteFeaturesConfigs,
	currentContextId,
	currentPageId,
	platformEnvData,
	experiments,
}: {
	platformBootstrapData: PlatformBootstrapData
	siteFeaturesConfigs: BootstrapData['sdkFactoriesSiteFeatureConfigs']
	currentContextId: string
	currentPageId: string
	platformEnvData: PlatformEnvData
	experiments: Experiments
}): BootstrapData {
	return {
		currentPageId,
		currentContextId,
		platformEnvData,
		sdkFactoriesSiteFeatureConfigs: _.pickBy(siteFeaturesConfigs, (__, featureName) => featureName.toLowerCase().includes('wixcodesdk')),
		...platformBootstrapData,
		experiments,
	}
}
