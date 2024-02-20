import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { LifeCycle } from '@wix/thunderbolt-symbols'
import { CyclicTabbing } from './cyclicTabbing'
import { CyclicTabbingSymbol } from './symbols'

export const site: ContainerModuleLoader = (bind) => {
	bind(CyclicTabbingSymbol).to(CyclicTabbing)
	bind(LifeCycle.AppWillMountHandler).to(CyclicTabbing)
}

export const editor: ContainerModuleLoader = site

export * from './symbols'
export { isElementTabbable } from './utils'
