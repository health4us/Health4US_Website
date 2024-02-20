import type { IHttpClient } from '@wix/fe-essentials-viewer-platform/http-client'
import type { FedopsLogger } from '@wix/fe-essentials-viewer-platform/fedops'
import { SiteMonitoringMessage } from '../formatters/convertToSiteMonitoringMessage'
import { EventId } from 'eventid'

const SCRIPT_ERROR = 'Script error.'
const MAX_LOGS_PER_BATCH = 10
const LOG_SENDING_INTERVAL = 500
// NOTE: This needs to be synched with the message wix-code-viewer-app sends when it runs the user code.
const IGNORED_MESSAGE_REGEX = /^Loading the code for the .+\. To debug this code, open .+ in your browser's Developer Tools\.$/

type RuntimeConfiguration = {
	hasSinks: boolean
}

const IS_SITE_MONITORING_ENABLED_INTERACTION_ENDED_CODES = {
	SUCCESS: 0,
	INVALID_RESPONSE: 1,
	EXCEPTION: 2,
}

export type SiteMonitoringServiceOptions = {
	baseUrl: string
	metaSiteId: string
	instance: string
	siteUrl: string
	viewMode: string
	revision: string
	fedopsLogger: FedopsLogger
	httpClient: IHttpClient
}

export type SiteMonitoringService = {
	send(message: SiteMonitoringMessage): void
	clear(): void
}

export const createSiteMonitoringService = ({
	baseUrl,
	metaSiteId,
	instance,
	siteUrl,
	viewMode,
	revision,
	fedopsLogger,
	httpClient,
}: SiteMonitoringServiceOptions): SiteMonitoringService => {
	const customParams = {
		baseUrl,
		metaSiteId,
		instance,
		siteUrl,
		viewMode,
		revision,
	}

	const isSiteMonitoringEnabled = async (): Promise<boolean> => {
		const url = `${baseUrl}/_api/wix-code-telemetry-registry-public/v1/sites/${metaSiteId}/telemetry/runtime-configuration`

		try {
			fedopsLogger.interactionStarted('is-site-monitoring-enabled', { customParams })

			const response = await fetch(url, { headers: { Authorization: instance } })

			if (!response.ok) {
				fedopsLogger.interactionEnded('is-site-monitoring-enabled', {
					customParams: {
						...customParams,
						code: IS_SITE_MONITORING_ENABLED_INTERACTION_ENDED_CODES.INVALID_RESPONSE,
						status: response.status,
					},
				})

				return false
			}

			const result: RuntimeConfiguration = await response.json()

			fedopsLogger.interactionEnded('is-site-monitoring-enabled', {
				customParams: {
					...customParams,
					code: IS_SITE_MONITORING_ENABLED_INTERACTION_ENDED_CODES.SUCCESS,
				},
			})

			return result.hasSinks
		} catch (e) {
			fedopsLogger.interactionEnded('is-site-monitoring-enabled', {
				customParams: {
					...customParams,
					code: IS_SITE_MONITORING_ENABLED_INTERACTION_ENDED_CODES.EXCEPTION,
					e,
				},
			})

			return false
		}
	}

	const logs: Array<object> = []
	const isSiteMonitoringEnabledPromise = isSiteMonitoringEnabled()
	const operationId = new EventId()
	const insertId = new EventId()

	const interval = setInterval(async () => {
		if (logs.length > 0) {
			if (await isSiteMonitoringEnabledPromise) {
				const batch = []

				for (let i = 0; i < MAX_LOGS_PER_BATCH; i++) {
					if (logs.length === 0) {
						break
					}

					batch.push(logs.shift())
				}

				const message = { messages: batch }

				fedopsLogger.interactionStarted('report-events-batch', { customParams })

				const telemetryUrl = `${baseUrl}/_api/wix-code-telemetry-collector/v1/telemetry-messages`

				httpClient
					.post(telemetryUrl, message)
					.then(() => {
						fedopsLogger.interactionEnded('report-events-batch', {
							customParams: {
								...customParams,
								code: IS_SITE_MONITORING_ENABLED_INTERACTION_ENDED_CODES.SUCCESS,
							},
						})
					})
					.catch((e) => {
						fedopsLogger.interactionEnded('report-events-batch', {
							customParams: {
								...customParams,
								code: IS_SITE_MONITORING_ENABLED_INTERACTION_ENDED_CODES.EXCEPTION,
								e,
							},
						})
					})
			}
		}
	}, LOG_SENDING_INTERVAL)

	return {
		send({ message, severity }: SiteMonitoringMessage) {
			if (message === SCRIPT_ERROR || IGNORED_MESSAGE_REGEX.test(message)) {
				return
			}

			logs.push({
				insertId: insertId.new(),
				timestamp: new Date().toISOString(),
				severity,
				labels: {
					siteUrl,
					namespace: 'Velo',
					tenantId: metaSiteId,
					viewMode,
					revision,
				},
				operation: {
					id: operationId.new(),
					producer: siteUrl,
					first: false,
					last: false,
				},
				sourceLocation: null,
				jsonPayload: {
					message,
				},
			})
		},
		clear() {
			clearInterval(interval)
		},
	}
}
