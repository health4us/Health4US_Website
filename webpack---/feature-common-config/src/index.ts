import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { PlatformEnvDataProviderSymbol, WixCodeSdkHandlersProviderSym } from '@wix/thunderbolt-symbols'
import { CommonConfigImpl } from './commonConfig'
import { CommonConfigSymbol, name } from './symbols'
import type { ICommonConfig } from './types'

export { CommonConfigSymbol, ICommonConfig, name }

export const site: ContainerModuleLoader = (bind) => {
	bind(CommonConfigSymbol, PlatformEnvDataProviderSymbol, WixCodeSdkHandlersProviderSym).to(CommonConfigImpl)
}

export const editor: ContainerModuleLoader = site
