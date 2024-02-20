import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { NavigationManager } from './navigationManager'
import { NavigationPageDidMountHandler } from './navigationPageDidMountHanlder'
import { LifeCycle, NavigationManagerSymbol } from '@wix/thunderbolt-symbols'

export const site: ContainerModuleLoader = (bind) => {
	bind(NavigationManagerSymbol).to(NavigationManager)
}

export const page: ContainerModuleLoader = (bind) => {
	bind(LifeCycle.PageDidMountHandler, LifeCycle.PageDidUnmountHandler).to(NavigationPageDidMountHandler)
}

export * from './symbols'
export type { INavigationManager } from './types'
