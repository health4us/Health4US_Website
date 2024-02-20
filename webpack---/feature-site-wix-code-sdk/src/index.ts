import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { PlatformEnvDataProviderSymbol, WixCodeSdkHandlersProviderSym } from '@wix/thunderbolt-symbols'
import { siteEnvDataProvider } from './sdk/siteEnvDataProvider'
import { siteSdkProvider } from './sdk/siteSdkProvider'

export const site: ContainerModuleLoader = (bind) => {
	bind(PlatformEnvDataProviderSymbol).to(siteEnvDataProvider)
	bind(WixCodeSdkHandlersProviderSym).to(siteSdkProvider)
}

export * from './symbols'
