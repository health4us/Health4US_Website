import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { name, OnLinkClickSymbol, PreviewTooltipCallbackSymbol } from './symbols'
import { ClickHandlerRegistrar } from './clickHandlerRegistrar'
import { LifeCycle } from '@wix/thunderbolt-symbols'
import type { IOnLinkClickHandler, IPreviewTooltipCallback } from './types'
import { OnLinkClickHandler } from './onLinkClickHandler'
import { PreviewTooltipCallback } from './previewTooltipCallback'

export const site: ContainerModuleLoader = (bind) => {
	bind(OnLinkClickSymbol).to(OnLinkClickHandler)
	bind(LifeCycle.AppDidMountHandler).to(ClickHandlerRegistrar)
}

export { name, PreviewTooltipCallbackSymbol, PreviewTooltipCallback, OnLinkClickSymbol }
export type { IPreviewTooltipCallback, IOnLinkClickHandler }
