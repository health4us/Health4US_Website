import { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import {
	LifeCycle,
	HeadContentSymbol,
	ComponentsStylesOverridesSymbol,
	RendererPropsExtenderSym,
	RegisterToUnmountSym,
} from '@wix/thunderbolt-symbols'
import { RendererPropsProviderSym } from '.'
import { PageMountUnmountSubscriber } from './clientRenderer/pageMountUnmountSubscriber'
import { ComponentsStylesOverrides } from './ComponentsStylesOverrides'
import { HeadContent } from './HeadContent'
import { RendererPropsProvider } from './RendererPropsProvider'
import { DeletedCompPropsProvider } from './components/DeletedComponent'

export const bindCommonSymbols: ContainerModuleLoader = (bind) => {
	bind(RendererPropsProviderSym).to(RendererPropsProvider)
	bind(HeadContentSymbol).to(HeadContent)
	bind(RegisterToUnmountSym, LifeCycle.AppWillLoadPageHandler).to(PageMountUnmountSubscriber)
	bind(ComponentsStylesOverridesSymbol).to(ComponentsStylesOverrides)
	bind(RendererPropsExtenderSym).to(DeletedCompPropsProvider)
}
