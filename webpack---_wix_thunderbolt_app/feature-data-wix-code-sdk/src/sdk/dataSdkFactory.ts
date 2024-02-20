import { WixCodeApiFactoryArgs } from '@wix/thunderbolt-symbols'
import createWixData from '@wix/wix-data-platformized-client'
import { namespace, DataWixCodeSdkSiteConfig } from '..'

export function DataSdkFactory({
	featureConfig,
	platformUtils,
	appEssentials,
}: WixCodeApiFactoryArgs<DataWixCodeSdkSiteConfig>) {
	const authHeaderProvider = {
		get() {
			return platformUtils.sessionService.getWixCodeInstance()
		},
	}

	const { gridAppId, segment, cloudDataUrl } = featureConfig

	const { httpClient } = appEssentials

	return {
		[namespace]: createWixData({
			cloudDataUrl,
			httpClient,
			gridAppId,
			segment,
			authHeader: authHeaderProvider,
		}),
	}
}
