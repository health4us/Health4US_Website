import _ from 'lodash'
import { ILogger, LoggerIntegrations } from '@wix/thunderbolt-symbols'
// eslint-disable-next-line no-restricted-syntax
import { create } from '@wix/fedops-logger'
import {
	commonBiLoggerFactory,
	createFedopsLogger,
	getBiStore,
	createNoopLogger,
	getEnvironment,
	multipleIncludes,
	yieldToMain,
} from '@wix/thunderbolt-commons'
import { factory } from '@wix/fe-essentials-viewer-platform/bi'
// @ts-ignore
import { createLoggerApi } from '@wix/thunderbolt-logger'
import { getAppName } from '../bi-module/getAppName'

const DEV_QUERY_PARAMS = [
	'viewerSource',
	'experiments',
	'WixCodeRuntimeSource',
	'debug',
	'debugViewer',
	'isWixCodeIntegration',
	'isqa',
]

export async function createLogger(loggerIntegrations: LoggerIntegrations): Promise<ILogger> {
	const { sentry, wixBiSession, viewerModel, fetch, ssrInitialEvents, onReport } = loggerIntegrations
	const mode = viewerModel && viewerModel.mode ? viewerModel.mode : { qa: true }
	const isSsr = !process.env.browser
	const url = viewerModel.requestUrl
	const shouldSendByUrls = multipleIncludes(url, DEV_QUERY_PARAMS)

	if ((mode.qa || !sentry || shouldSendByUrls) && !url.includes('forceReport')) {
		return createNoopLogger()
	}

	await yieldToMain()
	const biStore = getBiStore(wixBiSession, viewerModel)
	await yieldToMain()
	const biLoggerFactory = commonBiLoggerFactory.createBiLoggerFactoryForFedops({
		sessionManager: {
			getVisitorId: _.noop,
			getSiteMemberId: _.noop,
		},
		biStore,
		fetch,
		muteBi: viewerModel.requestUrl.includes('suppressbi=true'),
		factory,
		...(url.includes('disableBiLoggerBatch=true') ? { useBatch: false } : {}),
	})
	await yieldToMain()
	const fedopsLogger = createFedopsLogger({
		biLoggerFactory,
		phasesConfig: 'SEND_START_AND_FINISH',
		appName: getAppName(viewerModel),
		reportBlackbox: true,
		paramsOverrides: {
			is_rollout: biStore.is_rollout,
			isSuccessfulSSR: biStore.isSuccessfulSSR,
		},
		factory: create,
		muteThunderboltEvents: wixBiSession.muteThunderboltEvents,
		experiments: viewerModel.experiments,
	})
	await yieldToMain()
	const release = process.env.browser ? window.thunderboltVersion : process.env.APP_VERSION
	const sentryStore = {
		release: release && `${release}`.startsWith('1') ? release : undefined,
		environment: getEnvironment(viewerModel.fleetConfig.code),
		user: `${wixBiSession.viewerSessionId}`,
	} as const
	await yieldToMain()
	const logger = createLoggerApi({
		biLoggerFactory,
		fedopsLogger,
		sentry,
		sentryStore,
		shouldMuteErrors: biStore.isCached || wixBiSession.isjp,
		errorLimit: 50,
		isSsr,
		ssrInitialEvents,
		onReport,
	})
	await yieldToMain()
	if (!isSsr) {
		removeEventListener('error', window.fedops.reportError)
		removeEventListener('unhandledrejection', window.fedops.reportError)
		addEventListener(
			'offline',
			() => {
				logger.meter('offline')
			},
			true
		)
		addEventListener(
			'online',
			() => {
				logger.meter('online')
			},
			true
		)
		let pageVisibilty = 'visible'
		const pagehide = () => {
			const { visibilityState } = document
			if (visibilityState !== pageVisibilty) {
				pageVisibilty = visibilityState
				logger.meter(visibilityState)
			}
		}
		addEventListener('pagehide', pagehide, true)
		addEventListener('visibilitychange', pagehide, true)
		pagehide()
	}
	await yieldToMain()
	sentry.configureScope((scope: any) => {
		scope.addEventProcessor((event: any, hint?: any) => {
			if (event.release && `${event.release}`.startsWith('1') && hint?.originalException?.message) {
				const { message, name } = hint.originalException
				if (name && name.indexOf('ChunkLoadError') > -1) {
					event.fingerprint = ['ChunkLoadError']
				}
				if (event.level === 'error') {
					logger.meter('error', {
						paramsOverrides: {
							// @ts-ignore
							evid: 26,
							errorInfo: message,
							errorType: name,
							eventString: hint.event_id,
							tags: event.tags,
						},
					}) // this is a workaround to get error rate until we will have support for postgresSQL in fedonomy
				}
				return event
			}
			return null
		})
	})
	await yieldToMain()

	logger.setGlobalsForErrors({
		tags: { url: viewerModel.requestUrl, isSsr: !process.env.browser, ...viewerModel.deviceInfo },
		extra: { experiments: viewerModel.experiments },
	})
	await yieldToMain()
	return logger
}
