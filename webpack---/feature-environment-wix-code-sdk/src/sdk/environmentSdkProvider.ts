import { withDependencies } from '@wix/thunderbolt-ioc'
import { SdkHandlersProvider, HeadContentSymbol, IHeadContent } from '@wix/thunderbolt-symbols'
// import { DynamicPagesAPI } from 'feature-router'
import { EnvironmentWixCodeSdkHandlers } from '../types'

export const environmentSdkProvider = withDependencies(
	[HeadContentSymbol],
	(headContent: IHeadContent): SdkHandlersProvider<EnvironmentWixCodeSdkHandlers> => ({
		getSdkHandlers: () => ({
			addScriptToPreloadList: (url: string) => {
				headContent.addScriptToPreloadList(url)
			},
		}),
	})
)
