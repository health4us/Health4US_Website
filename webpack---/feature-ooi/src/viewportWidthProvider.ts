import { BrowserWindow, BrowserWindowSymbol } from '@wix/thunderbolt-symbols'
import { withDependencies } from '@wix/thunderbolt-ioc'

export type IViewportWidthProvider = { getViewportWidth: () => number }
export const OOIViewportWidthProviderSymbol = Symbol('OOIViewportWidthProvider')

export default withDependencies(
	[BrowserWindowSymbol],
	(window: BrowserWindow): IViewportWidthProvider => {
		return {
			getViewportWidth: () => {
				if (!process.env.browser) {
					return 0
				}

				return window!.innerWidth
			},
		}
	}
)
