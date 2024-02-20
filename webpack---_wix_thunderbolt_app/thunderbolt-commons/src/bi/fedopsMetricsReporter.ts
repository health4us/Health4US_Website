import { SiteAssetsMetricsReporter } from '@wix/site-assets-client'
import type { ILogger, IPlatformLogger } from '@wix/thunderbolt-symbols'

export const fedopsMetricsReporter = (logger: ILogger): SiteAssetsMetricsReporter => {
	const feature = 'thunderbolt-commons'
	return {
		reportAsyncWithCustomKey: <T>(asyncMethod: () => Promise<T>, methodName: string, key: string): Promise<T> => {
			return logger.reportAsyncWithCustomKey(asyncMethod, feature, methodName, key)
		},
		runAsyncAndReport: <T>(asyncMethod: () => Promise<T>, methodName: string): Promise<T> => {
			return logger.runAsyncAndReport(asyncMethod, feature, methodName)
		},
		runAndReport: <T>(method: () => T, methodName: string): T => {
			return logger.runAndReport(method, feature, methodName)
		},
		reportError: (err: Error): void => {
			logger.captureError(err, { tags: { feature, clientMetricsReporterError: true } })
		},
		meter: (metricName: string): void => {
			logger.meter(metricName)
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		histogram: (metricName: string, value: number): void => {},
	}
}

export const platformFedopsMetricsReporter = (logger: IPlatformLogger): SiteAssetsMetricsReporter => {
	return {
		reportAsyncWithCustomKey: <T>(asyncMethod: () => Promise<T>, methodName: string, key: string): Promise<T> => {
			return logger.reportAsyncWithCustomKey(methodName, key, asyncMethod)
		},
		runAsyncAndReport: <T>(asyncMethod: () => Promise<T>, methodName: string): Promise<T> => {
			return logger.runAsyncAndReport(methodName, asyncMethod)
		},
		runAndReport: <T>(method: () => T, methodName: string): T => {
			return logger.runAndReport(methodName, method)
		},
		reportError: (err: Error): void => {
			logger.captureError(err, { tags: { platformMetricsReporter: true } })
		},
		meter: (metricName: string): void => {
			logger.meter(metricName)
		},
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		histogram: (metricName: string, value: number): void => {},
	}
}
