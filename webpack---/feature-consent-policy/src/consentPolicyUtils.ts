import { ConsentPolicy, PolicyDetails } from '@wix/cookie-consent-policy-client'
import type { ConsentPolicySiteConfig } from './types'

export function consentPolicyToHeaderObject(consentPolicy: ConsentPolicy) {
	const mapping: Record<string, keyof ConsentPolicy> = {
		func: 'functional',
		anl: 'analytics',
		adv: 'advertising',
		dt3: 'dataToThirdParty',
		ess: 'essential',
	}

	const raw: any = {}
	for (const [cookieKey, policyField] of Object.entries(mapping)) {
		raw[cookieKey] = consentPolicy[policyField] ? 1 : 0
	}

	return {
		'consent-policy': encodeURIComponent(JSON.stringify(raw)),
	}
}

export const wixSitesDefaultPolicy: ConsentPolicy = {
	essential: true,
	functional: true,
	analytics: true,
	advertising: false,
	dataToThirdParty: true,
}

export const userSitesDefaultPolicy: ConsentPolicy = {
	essential: true,
	functional: true,
	analytics: true,
	advertising: true,
	dataToThirdParty: true,
}

export function getDefaultConsentPolicyToExport(config: ConsentPolicySiteConfig): PolicyDetails {
	const defaultPolicy = config.isWixSite ? wixSitesDefaultPolicy : userSitesDefaultPolicy
	return {
		defaultPolicy: true,
		policy: defaultPolicy,
	}
}
