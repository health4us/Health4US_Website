import { withDependencies } from '@wix/thunderbolt-ioc'
import {
	AppDidMountPromiseSymbol,
	BrowserWindowSymbol,
	DynamicLoadFeature,
	IPageDidMountHandler,
	ITpaPopup,
	RegisterToUnmount,
	RegisterToUnmountSym,
} from '@wix/thunderbolt-symbols'
import { ISessionManager, SessionManagerSymbol } from 'feature-session-manager'
import { TpaPopupApiSymbol } from './symbols'
import { isSSR } from '@wix/thunderbolt-commons'

export const TpaPopupFactory = withDependencies(
	[TpaPopupApiSymbol, SessionManagerSymbol, BrowserWindowSymbol, RegisterToUnmountSym, AppDidMountPromiseSymbol],
	(
		tpaPopupApi: ITpaPopup,
		sessionManager: ISessionManager,
		window: Window,
		mountUnmount: RegisterToUnmount,
		appDidMountPromise: Promise<unknown>
	): ITpaPopup & IPageDidMountHandler & DynamicLoadFeature => {
		const unregister = sessionManager.addLoadNewSessionCallback(tpaPopupApi.refreshAllPopups)
		const unmountCallback = () => {
			unregister()
			tpaPopupApi.closeNonPersistentPopups()
		}

		return {
			...tpaPopupApi,
			init() {
				mountUnmount.registerToPageDidUnmount(unmountCallback)
			},
			pageDidMount() {
				return unmountCallback
			},
			async openPopup(...args) {
				if (isSSR(window)) {
					// do not open popups in ssr even if requested from an OOI/wixCode
					return
				}
				await appDidMountPromise
				return tpaPopupApi.openPopup(...args)
			},
		}
	}
)
