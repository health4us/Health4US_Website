import { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { WixCodeSdkHandlersProviderSym } from '@wix/thunderbolt-symbols'
import { environmentSdkProvider } from './sdk/environmentSdkProvider'

export const site: ContainerModuleLoader = (bind) => {
	bind(WixCodeSdkHandlersProviderSym).to(environmentSdkProvider)
}

export * from './symbols'
export * from './types'
