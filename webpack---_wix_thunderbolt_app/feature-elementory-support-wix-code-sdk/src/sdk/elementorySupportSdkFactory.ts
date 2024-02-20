import type { WixCodeApiFactoryArgs } from '@wix/thunderbolt-symbols'
import type { ElementorySupportWixCodeSdkWixCodeApi, ElementoryWixCodeSdkSiteConfig } from '../types'
import { namespace } from '../symbols'
import elementorySupport from './elementorySupport'
import { createElementorySupportQueryParams } from './queryParams'

export const ElementorySupportSdkFactory = ({
	featureConfig,
	platformUtils: { sessionService, commonConfig },
	appEssentials: { httpClient },
	platformEnvData: {
		window: { csrfToken },
		site,
		mainGridAppId,
	},
	appDefinitionId,
}: WixCodeApiFactoryArgs<ElementoryWixCodeSdkSiteConfig>): {
	[namespace]: ElementorySupportWixCodeSdkWixCodeApi
} => {
	const { viewMode, baseUrl, relativePath, gridAppId, siteRevision } = featureConfig
	const useRelativePath =
		viewMode === 'site' && Boolean(site.experiments['specs.thunderbolt.useElementoryRelativePath'])

	const additionalHeaders: Record<string, string> = {}
	const overrideGridAppId = featureConfig.shouldUseMainGridAppId ? mainGridAppId || gridAppId : gridAppId
	const getQueryParameters = () =>
		createElementorySupportQueryParams(overrideGridAppId, sessionService.getWixCodeInstance(), viewMode)

	const getRequestOptions = () => ({
		headers: {
			'X-XSRF-TOKEN': csrfToken,
			'x-wix-site-revision': siteRevision.toString(),
			'x-wix-app-instance': sessionService.getInstance(appDefinitionId),
			commonConfig: commonConfig.getHeader(),
			Authorization: sessionService.getWixCodeInstance(),
			...additionalHeaders,
		},
	})

	const setHeader = (headerKey: string, headerValue: string) => {
		additionalHeaders[headerKey] = headerValue
	}

	return {
		[namespace]: elementorySupport(
			baseUrl,
			getQueryParameters,
			getRequestOptions,
			httpClient,
			sessionService,
			setHeader,
			useRelativePath,
			relativePath
		),
	}
}
