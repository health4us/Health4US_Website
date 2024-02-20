import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { ProtectedPagesClientRoutingHandler } from './protectedPagesClient'
import { ProtectedPagesAppWillMountHandler } from './loginAndNavigate'
import { ProtectedPagesServerRoutingHandler } from './protectedPagesServer'
import { RoutingMiddleware } from 'feature-router'
import { LifeCycle, TpaHandlerProviderSymbol } from '@wix/thunderbolt-symbols'
import { ProtectedPageTPAHandlers } from './tpaHandlers'
import type { IProtectedPagesApi } from './types'
import { ProtectedPagesApi } from './protectedPagesApi'

const ProtectedPagesApiSymbol = Symbol('ProtectedPagesApiSymbol')

export const site: ContainerModuleLoader = (bind) => {
	if (process.env.browser) {
		bind(RoutingMiddleware.Protected).to(ProtectedPagesClientRoutingHandler)
		bind(LifeCycle.AppWillMountHandler).to(ProtectedPagesAppWillMountHandler)
		bind(ProtectedPagesApiSymbol).to(ProtectedPagesApi)
	} else {
		bind(RoutingMiddleware.Protected).to(ProtectedPagesServerRoutingHandler)
	}
}

export const page: ContainerModuleLoader = (bind) => {
	bind(TpaHandlerProviderSymbol).to(ProtectedPageTPAHandlers)
}

export { IProtectedPagesApi, ProtectedPagesApiSymbol }
