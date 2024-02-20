import _ from 'lodash'
import { ViewerAppSpecData, CodePackage } from '@wix/thunderbolt-symbols'
import { BootstrapData } from '../../types'
import { BLOCKS_APPS_UTILS, BOOTSTRAP_DATA } from './moduleNames'
import createInvokePropsChangedApi from './invokePropsChangedFlagApi'

export interface IBlocksPreviewAppData {
	blocksPreviewData: {
		widgetsCodeMap: {
			[pageId: string]: {
				url: string
			}
		}
		widgetDescriptorsMap: { [widgetType: string]: object }
	}
}

interface IBlocksConsumerAppData {
	blocksConsumerData: {
		codeExperimentsQueryString: string
		codePackagesData: Array<CodePackage>
		invokePropsChangedOnUpdateConfig: boolean
	}
}

export interface IBlocksAppsUtils {
	createBlocksPreviewAppData(appData: ViewerAppSpecData): IBlocksPreviewAppData

	createBlocksConsumerAppData(appData: ViewerAppSpecData): IBlocksConsumerAppData

	isBlocksApp(appDefinitionId: string): boolean
}

export const BlocksAppsUtils = (bootstrapData: BootstrapData): IBlocksAppsUtils => {
	const {
		wixCodeBootstrapData: { wixCodePageIds, codePackagesData, wixCodeModel },
		platformEnvData,
		blocksBootstrapData,
	} = bootstrapData
	const invokePropsChangedApi = createInvokePropsChangedApi(bootstrapData)
	return {
		createBlocksPreviewAppData() {
			return {
				blocksPreviewData: {
					gridAppId: _.get(wixCodeModel, 'appData.codeAppId'),
					metaSiteId: platformEnvData.location.metaSiteId,
					widgetsCodeMap: _.mapValues(wixCodePageIds, (url) => ({ url })),
					widgetDescriptorsMap: platformEnvData.blocks?.blocksPreviewData?.widgetDescriptorsMap ?? {},
				},
			}
		},
		createBlocksConsumerAppData({ appDefinitionId }) {
			return {
				blocksConsumerData: {
					experiments: blocksBootstrapData.experiments,
					codeExperimentsQueryString: blocksBootstrapData.experimentsQueryParams,
					codePackagesData,
					invokePropsChangedOnUpdateConfig: invokePropsChangedApi.enabled(appDefinitionId),
				},
			}
		},
		isBlocksApp(appDefinitionId) {
			return Boolean(blocksBootstrapData.blocksAppsData[appDefinitionId])
		},
	}
}

export default {
	factory: BlocksAppsUtils,
	deps: [BOOTSTRAP_DATA],
	name: BLOCKS_APPS_UTILS,
}
