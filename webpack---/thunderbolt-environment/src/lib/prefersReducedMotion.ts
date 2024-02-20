import { BrowserWindow } from '@wix/thunderbolt-symbols'

export const prefersReducedMotion = (browserWindow: BrowserWindow, requestUrl = '') => {
	const shouldForce = requestUrl.toLowerCase().includes('forcereducedmotion')
	return shouldForce || Boolean(browserWindow?.matchMedia('(prefers-reduced-motion: reduce)').matches)
}
