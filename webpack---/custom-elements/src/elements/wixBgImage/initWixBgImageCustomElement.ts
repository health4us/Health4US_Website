// @ts-nocheck
import wixBgImageWrapper from './wixBgImage'
import { defineCustomElement } from '../../commons'

export const defineWixBgImage = (WixElement, contextWindow, externalServices, environmentConsts) => {
	const WixBgImage = wixBgImageWrapper(WixElement, externalServices, environmentConsts, contextWindow)
	defineCustomElement(contextWindow, 'wix-bg-image', WixBgImage)
}
