import { WixCodeApiFactoryArgs } from '@wix/thunderbolt-symbols'
import { createFedopsLogger } from '@wix/thunderbolt-commons'
import { namespace } from '../symbols'
import { createConsoleProxy } from './createConsoleProxy'
import { TelemetryWixCodeSdkWixCodeApi, TelemetryConsole } from '../types'
import { sendConsoleMessagesToEditor } from './sendConsoleMessagesToEditor'
import { createSiteMonitoringService } from './createSiteMonitoringService'
import { sendConsoleMessagesToSiteMonitoring } from './sendConsoleMessagesToSiteMonitoring'

export const TelemetrySdkFactory = ({
	wixCodeNamespacesRegistry,
	platformEnvData,
	platformUtils,
	onPageWillUnmount,
	appEssentials,
}: WixCodeApiFactoryArgs): {
	[namespace]: TelemetryWixCodeSdkWixCodeApi
} => {
	let consoleProxy: TelemetryConsole

	const { httpClient } = appEssentials

	return {
		[namespace]: {
			get console() {
				if (!consoleProxy) {
					const wixCodeSiteSdk = wixCodeNamespacesRegistry.get('site')

					const siteUrl = platformEnvData.location.externalBaseUrl
					const viewMode = platformEnvData.site.viewMode
					const fedopsLogger = createFedopsLogger({
						appName: 'telemetry-wix-code-sdk',
						biLoggerFactory: platformUtils.biUtils.createBiLoggerFactoryForFedops(),
						customParams: {
							viewerName: 'thunderbolt',
						},
						factory: platformUtils.essentials.createFedopsLogger,
						experiments: platformUtils.essentials.experiments.all(),
					})

					const siteMonitoringService = createSiteMonitoringService({
						baseUrl: viewMode === 'Site' ? siteUrl : platformUtils.clientSpecMapApi.getWixCodeBaseUrl(),
						metaSiteId: platformEnvData.location.metaSiteId,
						instance: platformUtils.sessionService.getWixCodeInstance(),
						siteUrl,
						viewMode,
						revision: wixCodeSiteSdk.revision,
						fedopsLogger,
						httpClient,
					})

					const { onLog, proxy } = createConsoleProxy(console)

					consoleProxy = proxy

					if (process.env.PACKAGE_NAME === 'thunderbolt-ds') {
						const unregister = onLog(sendConsoleMessagesToEditor(wixCodeSiteSdk))
						onPageWillUnmount(unregister)
					}

					if (!platformEnvData.window.isSSR) {
						const unregister = onLog(sendConsoleMessagesToSiteMonitoring(siteMonitoringService))
						onPageWillUnmount(unregister)
					}
				}

				return consoleProxy
			},
		},
	}
}
