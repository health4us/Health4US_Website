import { withDependencies } from '@wix/thunderbolt-ioc'
import { IPageDidMountHandler, IPageDidUnmountHandler, NavigationManagerSymbol } from '@wix/thunderbolt-symbols'
import { INavigationManager } from './types'

export const NavigationPageDidMountHandler = withDependencies(
	[NavigationManagerSymbol],
	(navigationManager: INavigationManager): IPageDidMountHandler & IPageDidUnmountHandler => {
		return {
			pageDidMount: () => {
				if (navigationManager.isFirstNavigation()) {
					navigationManager.endNavigation()
				}
			},
			pageDidUnmount: () => {
				if (!navigationManager.isFirstNavigation()) {
					navigationManager.endNavigation()
				}
			},
		}
	}
)
