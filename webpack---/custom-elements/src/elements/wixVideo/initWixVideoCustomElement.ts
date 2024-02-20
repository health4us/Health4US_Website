// @ts-nocheck
import wixVideoWrapper from './wixVideo'
import { defineCustomElement } from '../../commons'

export const defineWixVideo = (WixElement, contextWindow, externalServices, environmentConsts) => {
	const WixVideo = wixVideoWrapper(WixElement, externalServices, environmentConsts, contextWindow)
	defineCustomElement(contextWindow, 'wix-video', WixVideo)
}
