import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { PlatformEnvDataProviderSymbol, WixCodeSdkHandlersProviderSym } from '@wix/thunderbolt-symbols'
import { seoWixCodeSdkHandlersProvider } from './sdk/seoSdkProvider'
import { seoPlatformEnvDataProvider } from './sdk/seoDataProvider'

export const site: ContainerModuleLoader = (bind) => {
	bind(PlatformEnvDataProviderSymbol).to(seoPlatformEnvDataProvider)
	bind(WixCodeSdkHandlersProviderSym).to(seoWixCodeSdkHandlersProvider)
}

export const editor: ContainerModuleLoader = site

export * from './symbols'
export * from './types'
