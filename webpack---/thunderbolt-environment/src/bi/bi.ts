import {
	ReportBI,
	SendBeat,
	BIReporter,
	BISymbol,
	WixBiSessionSymbol,
	ReportPageNavigation,
	ReportPageNavigationDone,
	AppNameSymbol,
} from '@wix/thunderbolt-symbols'
import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { Environment } from '../types/Environment'
import { getAppName } from '../bi-module/getAppName'

const consoleReportBi = (...args: Array<any>) => console.log('[TB] ', ...args)

export function createBiReporter(
	reportBI: ReportBI = consoleReportBi,
	sendBeat: SendBeat = consoleReportBi,
	setDynamicSessionData: BIReporter['setDynamicSessionData'] = () => {},
	reportPageNavigation: ReportPageNavigation = consoleReportBi,
	reportPageNavigationDone: ReportPageNavigationDone = consoleReportBi
): BIReporter {
	return {
		reportBI,
		sendBeat,
		setDynamicSessionData,
		reportPageNavigation,
		reportPageNavigationDone,
	}
}

export const site = ({ biReporter, wixBiSession, viewerModel }: Environment): ContainerModuleLoader => (bind) => {
	bind(WixBiSessionSymbol).toConstantValue(wixBiSession)
	bind(BISymbol).toConstantValue(biReporter)
	bind(AppNameSymbol).toConstantValue(getAppName(viewerModel))
}
