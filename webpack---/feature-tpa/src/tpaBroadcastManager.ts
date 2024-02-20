import { withDependencies, named } from '@wix/thunderbolt-ioc'
import { IPageDidMountHandler, PageFeatureConfigSymbol, ConsentPolicySymbol } from '@wix/thunderbolt-symbols'
import type { TpaPageConfig, ITPAEventsListenerManager } from './types'
import { name, TpaEventsListenerManagerSymbol } from './symbols'
import { ConsentPolicyUpdatesListener } from 'feature-consent-policy'
import type { IConsentPolicy } from 'feature-consent-policy'
import { PolicyDetails } from '@wix/cookie-consent-policy-client'

export const TpaBroadcastManager = withDependencies(
	[named(PageFeatureConfigSymbol, name), ConsentPolicySymbol, TpaEventsListenerManagerSymbol],
	(
		tpaPageConfig: TpaPageConfig,
		consentPolicyApi: IConsentPolicy,
		tpaEventsListenerManager: ITPAEventsListenerManager
	): IPageDidMountHandler => {
		const changeListner: ConsentPolicyUpdatesListener = (policyDetails: PolicyDetails) => {
			Object.entries(tpaPageConfig.widgets).forEach((widget) => {
				tpaEventsListenerManager.dispatch('CONSENT_POLICY_UPDATE', () => policyDetails, { compId: widget[0] })
			})
		}

		return {
			pageDidMount() {
				return consentPolicyApi.registerToChanges(changeListner)
			},
		}
	}
)
