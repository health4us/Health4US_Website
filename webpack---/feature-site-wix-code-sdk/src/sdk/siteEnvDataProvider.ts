import { named, withDependencies } from '@wix/thunderbolt-ioc'
import {
	SiteFeatureConfigSymbol,
	PlatformEnvDataProvider,
	SiteWixCodeSdkSiteConfig,
	ExperimentsSymbol,
	Experiments,
	ViewerModelSym,
	ViewerModel,
	BrowserWindowSymbol,
	BrowserWindow,
} from '@wix/thunderbolt-symbols'
import { name } from '../symbols'

export const siteEnvDataProvider = withDependencies(
	[ExperimentsSymbol, named(SiteFeatureConfigSymbol, name), ViewerModelSym, BrowserWindowSymbol],
	(
		experiments: Experiments,
		siteWixCodeSdkSiteConfig: SiteWixCodeSdkSiteConfig,
		viewerModel: ViewerModel,
		window: BrowserWindow
	): PlatformEnvDataProvider => {
		const {
			mode,
			site: { isResponsive, siteId },
		} = viewerModel

		return {
			platformEnvData() {
				const { pageIdToTitle, viewMode } = siteWixCodeSdkSiteConfig || {}
				return {
					site: {
						experiments,
						isResponsive,
						siteId,
						pageIdToTitle,
						mode,
						viewMode,
						windowName: window?.name,
					},
				}
			},
		}
	}
)
