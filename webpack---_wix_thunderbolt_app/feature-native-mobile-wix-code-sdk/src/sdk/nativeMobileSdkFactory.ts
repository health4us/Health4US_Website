import { WixCodeApiFactoryArgs } from '@wix/thunderbolt-symbols'
import { mobileNamespace, navigationNamespace } from '../symbols'
import type {
	NativeMobileWixCodeSdkHandlers,
	NativeMobileWixCodeSdkWixCodeApi,
	NativeMobileWixCodeSdkSiteConfig,
} from '../types'

/**
 * This is SDK Factory.
 * Expose your Velo API
 */
export function NativeMobileSdkFactory({
	// featureConfig,
	handlers,
}: WixCodeApiFactoryArgs<
	NativeMobileWixCodeSdkSiteConfig,
	unknown,
	NativeMobileWixCodeSdkHandlers
>): NativeMobileWixCodeSdkWixCodeApi {
	return {
		[navigationNamespace]: {
			dismissAllModals: handlers.navigation.dismissAllModals,
			openURL: handlers.navigation.openURL,
		},
		[mobileNamespace]: {
			showAlert: handlers.systemUi.showAlert,
		},
	}
}
