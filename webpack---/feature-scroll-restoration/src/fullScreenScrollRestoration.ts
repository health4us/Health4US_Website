import { withDependencies } from '@wix/thunderbolt-ioc'
import { BrowserWindowSymbol, BrowserWindow, IAppDidMountHandler } from '@wix/thunderbolt-symbols'
import { getIsIpad, isChrome, isSafari, isSSR, isIphone } from '@wix/thunderbolt-commons'

enum DeviceOrientation {
	PORTRAIT,
	LANDSCAPE,
}

/*
 * Note: Currently, E2E tests for this file are not executed in CI. When modifying this file, please manually run the
 * skipped tests in `scroll-restoration.sled.spec.ts` using the non-headless mode.
 */
const fullScreenScrollRestorationFactory = (browserWindow: BrowserWindow): IAppDidMountHandler => {
	function getOrientation(): DeviceOrientation {
		if (browserWindow!.matchMedia('(orientation: portrait)').matches) {
			return DeviceOrientation.PORTRAIT
		}

		return DeviceOrientation.LANDSCAPE
	}

	return {
		appDidMount() {
			if (isSSR(browserWindow)) {
				return
			}

			const isSafariOnIpad = isSafari(browserWindow) && getIsIpad(browserWindow) && !isIphone(browserWindow)
			if (isChrome(browserWindow) || isSafariOnIpad) {
				let lastFullScreenElement: Element | null = null
				let lastOrientation: DeviceOrientation
				let lastScrollY = 0
				let isFullScreen = false

				browserWindow.addEventListener(
					'scroll',
					() => {
						/*
						 * Entering full screen mode triggers a scroll event with a scrollY value of 0.
						 * To handle this case accurately, setTimeout is used to ensure the
						 * callback is executed after updating the browser's full screen state, allowing
						 * the 'isFullScreen' variable to accurately reflect the current state.
						 */
						setTimeout(() => {
							if (!isFullScreen) {
								lastScrollY = browserWindow.scrollY
							}
						})
					},
					{ passive: true }
				)

				browserWindow.addEventListener('fullscreenchange', () => {
					const fullscreenElement = browserWindow.document.fullscreenElement
					isFullScreen = Boolean(fullscreenElement)

					if (isFullScreen) {
						lastFullScreenElement = fullscreenElement
						lastOrientation = getOrientation()
					} else {
						const currentOrientation = getOrientation()
						if (lastOrientation === currentOrientation) {
							browserWindow.scrollTo({ top: lastScrollY })
						} else {
							lastFullScreenElement?.scrollIntoView()
						}
					}
				})
			}
		},
	}
}

export const FullScreenScrollRestoration = withDependencies([BrowserWindowSymbol], fullScreenScrollRestorationFactory)
