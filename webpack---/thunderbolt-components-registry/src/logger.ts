import { COMPONENTS_REGISTRY_SENTRY_SPEC } from './common'

// @ts-ignore
const getSentry = () => (process.env.browser ? window.Sentry : require('@sentry/node'))

export const getLoggerClient = (isExperimentOpen?: (specName: string) => boolean) => {
	if (isExperimentOpen?.(COMPONENTS_REGISTRY_SENTRY_SPEC)) {
		const sentry = getSentry()
		return (loggerOptions: any) =>
			new sentry.Hub(
				process.env.browser ? new sentry.BrowserClient(loggerOptions) : new sentry.NodeClient(loggerOptions)
			)
	}
}
