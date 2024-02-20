// @ts-nocheck

import { throttleToAnimationFrame } from './utils/utils'
import wixBgMediaWrapper from './elements/wixBgMedia/wixBgMedia'
import wixElementWrapper from './elements/wixElement'
import wixImageWrapper from './elements/wixImage/wixImage'
import nativeShim from './shims/native-shim'
import { initResizeService } from './utils/initResizeService'

function init(services, contextWindow = window) {
	nativeShim(contextWindow)

	const windowResizeService = {
		registry: new Set(),
		observe(element) {
			windowResizeService.registry.add(element)
		},
		unobserve(element) {
			windowResizeService.registry.delete(element)
		},
	}

	services.windowResizeService.init(
		throttleToAnimationFrame(() => windowResizeService.registry.forEach((element) => element.reLayout())),
		contextWindow
	)

	const resizeService = initResizeService()

	const defineCustomElement = (elementName, elementClass) => {
		if (contextWindow.customElements.get(elementName) === undefined) {
			contextWindow.customElements.define(elementName, elementClass)
		}
	}

	const WixElement = wixElementWrapper({ resizeService }, contextWindow)
	contextWindow.customElementNamespace = { WixElement }

	defineCustomElement('wix-element', WixElement)

	const defineWixImage = (externalServices, environmentConsts) => {
		const WixImage = wixImageWrapper(WixElement, externalServices, environmentConsts, contextWindow)
		defineCustomElement('wix-image', WixImage)
	}

	const defineWixBgMedia = (externalServices) => {
		const WixBgMedia = wixBgMediaWrapper(WixElement, { windowResizeService, ...externalServices }, contextWindow)
		defineCustomElement('wix-bg-media', WixBgMedia)
	}

	return {
		contextWindow,
		defineWixImage,
		defineWixBgMedia,
	}
}

export default {
	init,
}
