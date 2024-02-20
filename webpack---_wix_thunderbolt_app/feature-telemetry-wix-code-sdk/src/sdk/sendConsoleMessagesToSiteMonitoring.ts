import { convertToSiteMonitoringMessage } from '../formatters/convertToSiteMonitoringMessage'
import { ConsoleMessageData } from '../types'
import { SiteMonitoringService } from './createSiteMonitoringService'

export const sendConsoleMessagesToSiteMonitoring = (siteMonitoringService: SiteMonitoringService) => async (
	consoleMessage: ConsoleMessageData
) => {
	const message = convertToSiteMonitoringMessage(consoleMessage)

	if (message) {
		siteMonitoringService.send(message)
	}
}
