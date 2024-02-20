import { BootstrapData } from '../../types'

const EXPORT_UPDATE_CONFIG_BLACKLIST = ['cffc6740-8042-48cc-a35b-d3fd03a69f0c', 'd90652a2-f5a1-4c7c-84c4-d4cdcc41f130', '1522827f-c56c-a5c9-2ac9-00f9e6ae12d3', '3e950e28-b054-4df6-ad7b-9e28ffc5072e'] // staff members, portfolio, pricing plans, appointment field

const isInBlacklist = (appDefinitionId: string) => EXPORT_UPDATE_CONFIG_BLACKLIST.includes(appDefinitionId)

export default ({ platformEnvData }: BootstrapData) => {
	return {
		enabled(appDefinitionId: string) {
			if (platformEnvData.site.experiments['specs.thunderbolt.blocksUpdateConfigBlacklistCleanup']) {
				return true
			}
			return !isInBlacklist(appDefinitionId)
		},
	}
}
