// @ts-nocheck
import fastdom from 'fastdom'
import wixDropdownMenuWrapper from './wixDropdownMenu'
import { initResizeService } from '../../utils/initResizeService'

export const initCustomElementsDropdownMenu = () => {
	if (window.customElements && !window.customElements.get('wix-dropdown-menu')) {
		const resizeService = initResizeService()
		const WixElement = window.customElementNamespace?.WixElement

		const WixDropdownMenu = wixDropdownMenuWrapper(WixElement, { resizeService, mutationService: fastdom }, window)
		window.customElements.define('wix-dropdown-menu', WixDropdownMenu)
	}
}
