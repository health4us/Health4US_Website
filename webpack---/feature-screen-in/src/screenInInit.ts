import { named, withDependencies } from '@wix/thunderbolt-ioc'
import {
	CompsLifeCycleSym,
	ICompsLifeCycle,
	IPageWillMountHandler,
	IPageWillUnmountHandler,
	PageFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import type { GetScreenInInitCallback } from './types'
import { name, SCREEN_IN_CALLBACK, ScreenInInitCallbackSymbol } from './symbols'
import { ScreenInPageConfig } from './types'

export const ScreenInInit = withDependencies(
	[named(PageFeatureConfigSymbol, name), ScreenInInitCallbackSymbol, CompsLifeCycleSym],
	(
		featureConfig: ScreenInPageConfig,
		getScreenInInitCallback: GetScreenInInitCallback,
		compsLifeCycle: ICompsLifeCycle
	): IPageWillMountHandler | IPageWillUnmountHandler => {
		let unregisterFromCompLifeCycle = () => {}

		return {
			name: 'screenInInit',
			pageWillMount() {
				const animatedIdsOnDomReady = new Set<string>()
				const initCallback = getScreenInInitCallback()

				if (!initCallback) {
					return
				}

				const compIds = Object.keys(featureConfig.compIdToActions || {})

				const registerToCompDidMount = () =>
					compsLifeCycle.registerToCompLifeCycle(
						compIds,
						SCREEN_IN_CALLBACK,
						(compId: string, displayedId: string, dom: HTMLElement | null) => {
							// delete from set, so we can run screenIn animation again if component is un-mounted and re-mounted
							if (animatedIdsOnDomReady.has(displayedId)) {
								animatedIdsOnDomReady.delete(displayedId)
								return
							}

							initCallback(compId, displayedId, dom)
						}
					)
				unregisterFromCompLifeCycle = registerToCompDidMount()
			},
			pageWillUnmount() {
				unregisterFromCompLifeCycle()
			},
		}
	}
)
