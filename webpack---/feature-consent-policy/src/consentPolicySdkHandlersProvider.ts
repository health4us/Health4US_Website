import { withDependencies } from '@wix/thunderbolt-ioc'
import type { ConsentPolicy } from '@wix/cookie-consent-policy-client'
import { SdkHandlersProvider, ConsentPolicySymbol } from '@wix/thunderbolt-symbols'
import type { ConsentPolicySdkHandlers, ConsentPolicyUpdatesListener, IConsentPolicy } from './types'

export const ConsentPolicySdkHandlersProvider = withDependencies(
	[ConsentPolicySymbol],
	(consentPolicyApi: IConsentPolicy): SdkHandlersProvider<ConsentPolicySdkHandlers> => {
		return {
			getSdkHandlers: () => ({
				consentPolicy: {
					setConsentPolicy: (policy: ConsentPolicy) => consentPolicyApi.setConsentPolicy(policy),
					resetConsentPolicy: () => consentPolicyApi.resetConsentPolicy(),
					registerToConsentPolicyUpdates: (listener: ConsentPolicyUpdatesListener) =>
						consentPolicyApi.registerToChanges(listener),
				},
			}),
		}
	}
)
