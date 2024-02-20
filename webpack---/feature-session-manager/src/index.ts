import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { SessionManagerSymbol, name, AuthorizationCodeRefreshSymbol, SessionProviderSymbol } from './symbols'
import { SessionManager as ClientSessionManager } from './clientSessionManager'
import { SessionManager as ServerSessionManager } from './serverSessionManager'
import { PlatformEnvDataProviderSymbol, WixCodeSdkHandlersProviderSym } from '@wix/thunderbolt-symbols'
import { sessionEnvDataProvider } from './sessionEnvDataProvider'
import { AuthorizationCodeRefresh } from './AuthorizationCodeRefresh'
import { ClientSessionProvider } from './clientSessionProvider'

export const site: ContainerModuleLoader = (bind) => {
	bind(AuthorizationCodeRefreshSymbol).to(AuthorizationCodeRefresh)
	if (process.env.browser) {
		bind(SessionProviderSymbol).to(ClientSessionProvider)
		bind(SessionManagerSymbol, WixCodeSdkHandlersProviderSym).to(ClientSessionManager)
	} else {
		bind(SessionManagerSymbol).to(ServerSessionManager)
	}
	bind(PlatformEnvDataProviderSymbol).to(sessionEnvDataProvider)
}

export type { ISessionManager, SessionHandlers, Instance } from './types'

export { SessionManagerSymbol, sessionEnvDataProvider, name }
