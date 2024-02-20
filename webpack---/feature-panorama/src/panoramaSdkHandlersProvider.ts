import { withDependencies } from '@wix/thunderbolt-ioc'
import { BrowserWindow, BrowserWindowSymbol, PanoramaSdkHandlers, SdkHandlersProvider } from '@wix/thunderbolt-symbols'

export const panoramaSdkHandlersProvider = withDependencies(
	[BrowserWindowSymbol],
	(window: NonNullable<BrowserWindow>): SdkHandlersProvider<PanoramaSdkHandlers> => {
		return {
			getSdkHandlers: () => ({
				panorama: {
					onUnhandledError: (handler: (error: Error) => void) => {
						window.Sentry.onLoad(() => {
							window.Sentry.addGlobalEventProcessor((event, hint) => {
								const exceptions = event.exception?.values ?? []

								if (exceptions[0]?.mechanism?.handled) {
									if (event?.tags?.dontReportIfPanoramaEnabled) {
										return null
									}

									return event
								}

								if (hint.originalException instanceof Error) {
									handler(hint.originalException)
									return null
								}

								return event
							})
						})
					},
					onBreadcrumb: (handler: (breadcrumb: any) => void) => {
						window.onBeforeSentryBreadcrumb = handler
					},
				},
			}),
		}
	}
)
