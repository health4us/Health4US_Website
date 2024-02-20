// @ts-nocheck
import { initWixIframe } from './elements/wixIframe/initIframeCustomElements'
import { defineWixVideo } from './elements/wixVideo/initWixVideoCustomElement'
import { defineWixBgImage } from './elements/wixBgImage/initWixBgImageCustomElement'
import { prefersReducedMotion } from '@wix/thunderbolt-environment'

export const initLazyCustomElements = (contextWindow?: any = window) => {
	const {
		WixElement,
		mediaServices,
		environmentConsts,
		requestUrl,
		staticVideoUrl,
	} = contextWindow.customElementNamespace

	defineWixVideo(WixElement, contextWindow, mediaServices, {
		...environmentConsts,
		prefersReducedMotion: prefersReducedMotion(window, requestUrl),
		staticVideoUrl,
	})

	initWixIframe(contextWindow, WixElement)
	defineWixBgImage(WixElement, contextWindow, mediaServices, environmentConsts)
}
