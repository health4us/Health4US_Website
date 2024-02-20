// @ts-nocheck
import wixIframeWrapper from './wixIframe'
import { defineCustomElement } from '../../commons'

export const initWixIframe = (contextWindow, WixElement) => {
	// WixElement saved on window in wixCustomElementsRegistry, which runs before initializing
	const WixIframe = wixIframeWrapper(WixElement)
	defineCustomElement(contextWindow, 'wix-iframe', WixIframe)
}
