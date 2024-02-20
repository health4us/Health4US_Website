import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	SiteFeatureConfigSymbol,
	FeatureExportsSymbol,
	IAppWillMountHandler,
	ExperimentsSymbol,
	Experiments,
	ConsentPolicySymbol,
} from '@wix/thunderbolt-symbols'
import type { IConsentPolicy, ConsentPolicySiteConfig } from './types'
import { name } from './symbols'
import { IFeatureExportsStore } from 'thunderbolt-feature-exports'
import { getDefaultConsentPolicyToExport } from './consentPolicyUtils'
import type { ConsentPolicyKey } from '@wix/cookie-consent-policy-client'

export const ConsentPolicyAppMountHandler = withDependencies<IAppWillMountHandler>(
	[named(SiteFeatureConfigSymbol, name), ConsentPolicySymbol, named(FeatureExportsSymbol, name), ExperimentsSymbol],
	(
		config: ConsentPolicySiteConfig,
		consentPolicyAPI: IConsentPolicy,
		consentPolicyExports: IFeatureExportsStore<typeof name>,
		experiments: Experiments
	) => {
		return {
			appWillMount() {
				const shouldExportCurrentConsentPolicy =
					experiments['specs.thunderbolt.shouldExportCurrentConsentPolicy']
				const currentConsentPolicy = shouldExportCurrentConsentPolicy
					? consentPolicyAPI.getCurrentConsentPolicy()
					: getDefaultConsentPolicyToExport(config)
				consentPolicyExports.export({
					currentConsentPolicy,
					openSettingModal: (categories: Array<ConsentPolicyKey> = []) => {
						consentPolicyAPI.publishPolicyUpdateRequestedEvent(categories)
					},
				})
			},
		}
	}
)
