import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { PlatformEnvDataProviderSymbol } from '@wix/thunderbolt-symbols'

import { СomponentsRegistryPlatformEnvDataProvider } from './componentsRegistry'

export const site: ContainerModuleLoader = (bind) => {
	bind(PlatformEnvDataProviderSymbol).to(СomponentsRegistryPlatformEnvDataProvider)
}

export const editor: ContainerModuleLoader = (bind) => {
	bind(PlatformEnvDataProviderSymbol).to(СomponentsRegistryPlatformEnvDataProvider)
}

export * from './symbols'
