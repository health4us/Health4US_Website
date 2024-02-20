import { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { WixCodeSdkHandlersProviderSym } from '@wix/thunderbolt-symbols'
import { panoramaSdkHandlersProvider } from './panoramaSdkHandlersProvider'

export const site: ContainerModuleLoader = (bind) => {
	if (process.env.browser) {
		bind(WixCodeSdkHandlersProviderSym).to(panoramaSdkHandlersProvider)
	}
}
