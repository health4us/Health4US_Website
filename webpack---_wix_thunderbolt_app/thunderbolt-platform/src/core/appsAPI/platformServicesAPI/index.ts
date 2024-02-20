import _ from 'lodash'
import { ManagerSlave } from '@wix/bsi-manager'
import { createFedopsLogger } from '@wix/thunderbolt-commons'
import type { ViewerPlatformEssentials } from '@wix/fe-essentials-viewer-platform'
import type { PlatformServicesAPI, PlatformEnvData, SessionServiceAPI, Experiments } from '@wix/thunderbolt-symbols'
import { biFactory } from './bi'
import { monitoringFactory } from './monitoring'
import { platformBiLoggerFactory } from '../../bi/biLoggerFactory'
import type { BatchQueue } from '@wix/wix-bi-logger-client'
import type { BaseFactory } from '@wix/thunderbolt-logger'
import type { FedopsLogger } from '@wix/fe-essentials-viewer-platform/fedops'
import type { IBlocksAppsUtils } from '../../modules/blocksAppsUtils'

type CreateLoggerFactoriesParams = {
	biLoggerFactoriesCreator: ReturnType<typeof platformBiLoggerFactory>
	_createFedopsLogger: ViewerPlatformEssentials['createFedopsLogger']
	bsiManager: ManagerSlave
	biData: PlatformEnvData['bi']
	appParams: { appDefinitionId: string; instanceId: string }
	viewMode: string
	experiments: Experiments
	batchQueueBi?: BatchQueue
	batchQueueFedops?: BatchQueue
}
type CreateLoggerFactoriesForApp = (params: CreateLoggerFactoriesParams) => { biLoggerFactory: () => BaseFactory; fedOpsLoggerFactory: FedopsLogger<string> }

const createLoggerFactoriesForApp: CreateLoggerFactoriesForApp = ({
	biLoggerFactoriesCreator,
	bsiManager,
	biData,
	_createFedopsLogger,
	appParams: { appDefinitionId, instanceId },
	viewMode,
	experiments,
	batchQueueBi,
	batchQueueFedops,
}) => {
	const appDefaults = {
		_appId: appDefinitionId,
		_instanceId: instanceId,
	}
	const biBaseFactory = () => {
		const base = biLoggerFactoriesCreator
			.createBaseBiLoggerFactory()
			.withNonEssentialContext({
				bsi: () => bsiManager.getBsi(),
			})
			.updateDefaults(appDefaults)

		if (batchQueueBi) {
			base.setGlobalBatchQueue(batchQueueBi)
		}

		return base
	}

	const fedopsBiLoggerFactory = biLoggerFactoriesCreator
		.createBiLoggerFactoryForFedops()
		.withNonEssentialContext({
			bsi: () => bsiManager.getBsi({ extend: false }),
		})
		.updateDefaults(appDefaults)

	if (batchQueueFedops) {
		fedopsBiLoggerFactory.setGlobalBatchQueue(batchQueueFedops)
	}

	const fedOpsLoggerFactory = createFedopsLogger({
		biLoggerFactory: fedopsBiLoggerFactory,
		customParams: {
			isMobileFriendly: biData.isMobileFriendly,
			viewerName: 'thunderbolt',
			viewMode,
		},
		paramsOverrides: { is_rollout: biData.rolloutData.isTBRollout, isSuccessfulSSR: biData.isSuccessfulSSR },
		factory: _createFedopsLogger,
		experiments,
	})

	return { biLoggerFactory: biBaseFactory, fedOpsLoggerFactory }
}

export const createPlatformAppServicesApi = ({
	platformEnvData: {
		bi: biData,
		document: { referrer },
		location,
		site,
		topology,
	},
	appDefinitionId,
	instanceId,
	csrfToken,
	bsiManager,
	sessionService,
	essentials,
	blocksAppsUtils,
	batchQueueBi,
	batchQueueFedops,
}: {
	platformEnvData: PlatformEnvData
	appDefinitionId: string
	instanceId: string
	csrfToken: string
	bsiManager: ManagerSlave
	sessionService: SessionServiceAPI
	essentials: ViewerPlatformEssentials
	blocksAppsUtils: IBlocksAppsUtils
	batchQueueBi?: BatchQueue
	batchQueueFedops?: BatchQueue
}): PlatformServicesAPI => {
	const viewMode = biData.isPreview ? ('preview' as const) : ('site' as const)

	const biLoggerFactoriesCreator = platformBiLoggerFactory({ sessionService, biData, location, site, factory: essentials.biLoggerFactory })

	const { biLoggerFactory, fedOpsLoggerFactory } = createLoggerFactoriesForApp({
		biLoggerFactoriesCreator,
		_createFedopsLogger: essentials.createFedopsLogger,
		biData,
		bsiManager,
		appParams: { appDefinitionId, instanceId },
		viewMode,
		experiments: site.experiments,
		batchQueueBi,
		batchQueueFedops,
	})

	const bi = biFactory({ biData, metaSiteId: location.metaSiteId, viewMode, sessionService })
	const monitoring = monitoringFactory({ url: biData.pageData.pageUrl, viewMode, viewerVersion: biData.viewerVersion, referrer })
	const appEssentials = essentials.createAppEssentials({
		appDefId: appDefinitionId,
		shouldElevateBlocksAppPermissions: blocksAppsUtils.isBlocksApp(appDefinitionId),
		getLoggerForWidget: fedOpsLoggerFactory.getLoggerForWidget.bind(fedOpsLoggerFactory),
		biLoggerFactory,
	})

	return {
		getCsrfToken: () => csrfToken,
		bi,
		biLoggerFactory,
		fedOpsLoggerFactory,
		reportTrace: _.noop,
		monitoring,
		essentials: appEssentials,
		topology,
	}
}
