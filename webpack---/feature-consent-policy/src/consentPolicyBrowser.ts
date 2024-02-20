import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	SiteFeatureConfigSymbol,
	ViewerModel,
	ViewerModelSym,
	BrowserWindow,
	BrowserWindowSymbol,
	FeatureExportsSymbol,
	ExperimentsSymbol,
	Experiments,
} from '@wix/thunderbolt-symbols'
import { getDefaultConsentPolicyToExport } from './consentPolicyUtils'
import { CommonConfigSymbol, ICommonConfig } from 'feature-common-config'
import type { IConsentPolicy, ConsentPolicySiteConfig, ConsentPolicyUpdatesListener } from './types'
import type { ConsentPolicyKey } from '@wix/cookie-consent-policy-client'
import { name } from './symbols'
import type { IFeatureExportsStore } from 'thunderbolt-feature-exports'

// This loads the consentPolicyManager client script, as part of the feature bundle
import '@wix/cookie-consent-policy-client'

export const ConsentPolicyBrowser = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		CommonConfigSymbol,
		ViewerModelSym,
		BrowserWindowSymbol,
		named(FeatureExportsSymbol, name),
		ExperimentsSymbol,
	],
	(
		config: ConsentPolicySiteConfig,
		commonConfig: ICommonConfig,
		viewerModel: ViewerModel,
		window: BrowserWindow,
		consentPolicyExports: IFeatureExportsStore<typeof name>,
		experiments: Experiments
	): IConsentPolicy => {
		const listeners: Set<ConsentPolicyUpdatesListener> = new Set()

		const api: IConsentPolicy = {
			getCurrentConsentPolicy() {
				return window!.consentPolicyManager!.getCurrentConsentPolicy()
			},
			_getConsentPolicyHeader() {
				return window!.consentPolicyManager!._getConsentPolicyHeader()
			},
			setConsentPolicy(policy) {
				return new Promise((resolve, reject) => {
					window!.consentPolicyManager!.setConsentPolicy(policy, resolve, reject)
				})
			},
			resetConsentPolicy() {
				window!.consentPolicyManager!.resetPolicy()
				return Promise.resolve()
			},
			registerToChanges(listener) {
				listeners.add(listener)
				return () => listeners.delete(listener)
			},
			publishPolicyUpdateRequestedEvent(cookieCategories: Array<ConsentPolicyKey> = []) {
				window!.consentPolicyManager!.publishPolicyUpdateRequestedEvent(cookieCategories)
			},
		}

		window!.consentPolicyManager!.init({
			baseUrl: viewerModel.site.externalBaseUrl,
			consentPolicy: config.siteConsentPolicy,
		})
		commonConfig.updateCommonConfig({
			consentPolicy: api.getCurrentConsentPolicy().policy,
			consentPolicyHeader: api._getConsentPolicyHeader(),
		})

		const onConsentPolicyChanged = (): void => {
			const policyDetails = window!.consentPolicyManager!.getCurrentConsentPolicy()
			const policyHeaderObject = window!.consentPolicyManager!._getConsentPolicyHeader()
			commonConfig.updateCommonConfig({
				consentPolicy: policyDetails.policy,
				consentPolicyHeader: policyHeaderObject,
			})
			listeners.forEach((listener) => listener(policyDetails, policyHeaderObject))
			const shouldExportCurrentConsentPolicy = experiments['specs.thunderbolt.shouldExportCurrentConsentPolicy']
			const currentConsentPolicy = shouldExportCurrentConsentPolicy
				? api.getCurrentConsentPolicy()
				: getDefaultConsentPolicyToExport(config)
			consentPolicyExports.export({
				currentConsentPolicy,
				openSettingModal: (categories: Array<ConsentPolicyKey> = []) => {
					api.publishPolicyUpdateRequestedEvent(categories)
				},
			})
		}

		// @ts-ignore
		window!.document.addEventListener('consentPolicyChanged', onConsentPolicyChanged)

		return api
	}
)
