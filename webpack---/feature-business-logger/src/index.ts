import _ from 'lodash'
import { ContainerModuleLoader, named, withDependencies } from '@wix/thunderbolt-ioc'
import { BusinessLoggerFactory } from './businessLogger'
import { BsiManagerSymbol, name } from './symbols'
import { WixCodeSdkHandlersProviderSym, BusinessLoggerSymbol, FeatureExportsSymbol } from '@wix/thunderbolt-symbols'
import { bsiSdkHandlersProvider } from './bsiSdkHandlersProvider'
import { BsiManager } from './bsiManager'
import type { BusinessLogger } from './types'
import { UrlChangeHandlerForPage } from 'feature-router'
import { IFeatureExportsStore } from 'thunderbolt-feature-exports'

export const site: ContainerModuleLoader = (bind) => {
	bind(BusinessLoggerSymbol).to(BusinessLoggerFactory)
	bind(BsiManagerSymbol, UrlChangeHandlerForPage).to(BsiManager) // TODO bind to page container
	bind(WixCodeSdkHandlersProviderSym).to(bsiSdkHandlersProvider)
}

export const editor: ContainerModuleLoader = (bind) => {
	bind(BusinessLoggerSymbol).to(
		withDependencies(
			[named(FeatureExportsSymbol, name)],
			(businessLoggerExports: IFeatureExportsStore<typeof name>) => {
				const noop = () => Promise.resolve()

				const businessLogger: BusinessLogger = {
					reportBi: noop,
					logger: {
						log: noop,
						flush: noop,
						updateDefaults: () => businessLogger.logger,
						report: noop,
					},
				}

				businessLoggerExports.export(businessLogger)

				return businessLogger
			}
		)
	)
	bind(WixCodeSdkHandlersProviderSym).to(
		withDependencies([], () => {
			return {
				getSdkHandlers: () => ({
					reportActivity: _.noop,
				}),
			}
		})
	)
}

export type { BusinessLogger, IBsiManager } from './types'
export { BsiManagerSymbol, name }
