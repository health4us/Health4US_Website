import { named, withDependencies } from '@wix/thunderbolt-ioc'
import {
	ILogger,
	IPageDidMountHandler,
	LoggerSymbol,
	MasterPageFeatureConfigSymbol,
	pageIdSym,
} from '@wix/thunderbolt-symbols'
import { name as translationFeatureName } from './symbols'
import { TranslationMasterPageConfig } from './types'
import { INavigationManager, NavigationManagerSymbol } from 'feature-navigation-manager'

export const CorruptedTranslationsBI = withDependencies(
	[named(MasterPageFeatureConfigSymbol, translationFeatureName), LoggerSymbol, pageIdSym, NavigationManagerSymbol],
	(
		masterPageConfig: TranslationMasterPageConfig,
		logger: ILogger,
		pageIdSymbol: string,
		navigationManager: INavigationManager
	): IPageDidMountHandler => {
		return {
			pageDidMount() {
				if (navigationManager.isFirstNavigation() && pageIdSymbol === 'masterPage') {
					const { isPageUriSEOTranslated, hasOriginalLanguageTranslation } = masterPageConfig
					logger.meter('translationCorruption', {
						customParams: { isPageUriSEOTranslated, hasOriginalLanguageTranslation },
					})
				}
			},
		}
	}
)
