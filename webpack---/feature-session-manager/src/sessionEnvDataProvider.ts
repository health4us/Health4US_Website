import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { PlatformEnvDataProvider, SiteFeatureConfigSymbol } from '@wix/thunderbolt-symbols'
import type { ISessionManager } from './types'
import { name, SessionManagerSymbol } from './symbols'
import { SessionManagerSiteConfig } from './types'

export const sessionEnvDataProvider = withDependencies(
	[SessionManagerSymbol, named(SiteFeatureConfigSymbol, name)],
	(sessionManager: ISessionManager, siteFeatureConfig: SessionManagerSiteConfig): PlatformEnvDataProvider => {
		return {
			platformEnvData() {
				return {
					session: {
						applicationsInstances: sessionManager.getAllInstances(),
						siteMemberId: sessionManager.getSiteMemberId(),
						visitorId: sessionManager.getVisitorId(),
						svSession: sessionManager.getUserSession(),
						smToken: sessionManager.getSmToken(),
						isRunningInDifferentSiteContext: siteFeatureConfig.isRunningInDifferentSiteContext,
					},
				}
			},
		}
	}
)
