import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { AppDidMountPromiseSymbol, BatchingStrategySymbol, LifeCycle, RendererSymbol } from '@wix/thunderbolt-symbols'
import type { RendererProps, AppProps, ClientRenderResponse, IRendererPropsProvider } from './types'
import { PageTransitionsHandlerSymbol, RendererPropsProviderSym, ThunderboltRootComponentRendererSym } from './symbols'
import { bindCommonSymbols } from './bindCommonSymbols'
import { PageTransitionsHandler } from './pageTransitionsHandler'
import { appDidMountPromise, ReactClientRenderer, AppRootRenderer } from './clientRenderer/reactClientRenderer'
import { ClientBatchingStrategy } from './components/clientBatchingStrategy'
import { ReactTestingRenderer } from './clientRenderer/reactTestingRenderer'

export const site: ContainerModuleLoader = (bind) => {
	bindCommonSymbols(bind)
	bind(BatchingStrategySymbol, LifeCycle.AppDidMountHandler).to(ClientBatchingStrategy)
	bind(AppDidMountPromiseSymbol).toConstantValue(appDidMountPromise)
	if (process.env.NODE_ENV === 'test') {
		bind(RendererSymbol).to(ReactTestingRenderer)
	} else {
		bind(RendererSymbol).to(ReactClientRenderer)
	}
	bind(ThunderboltRootComponentRendererSym).to(AppRootRenderer)
	bind(PageTransitionsHandlerSymbol, LifeCycle.AppWillLoadPageHandler).to(PageTransitionsHandler)
}

export { RendererProps, AppProps, ClientRenderResponse, RendererPropsProviderSym, IRendererPropsProvider }
