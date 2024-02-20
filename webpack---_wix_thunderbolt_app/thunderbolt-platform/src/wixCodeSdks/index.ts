import { NativeMobileSdkFactory } from 'feature-native-mobile-wix-code-sdk/factory'
import type { ClientSpecMapAPI, PlatformEnvData, IModelsAPI } from '@wix/thunderbolt-symbols'
import { isWixWidgetEditorRequired } from 'feature-widget-wix-code-sdk/predicate'
import { isWixEditorRequired } from 'feature-editor-wix-code-sdk/predicate'
import { isDashboardWixCodeSdkRequired } from 'feature-dashboard-wix-code-sdk/predicate'
import { isTelemetryWixCodeSdkRequired } from 'feature-telemetry-wix-code-sdk/predicate'
import { isWixDataRequired } from 'feature-data-wix-code-sdk/predicate'
import { isElementorySupportWixCodeSdkRequired } from 'feature-elementory-support-wix-code-sdk/predicate'

import { importWidgetSdkFactory } from './loadWidgetFactory'
import { importEditorSdkFactory } from './loadEditorFactory'
import { importDashboardSdkFactory } from './loadDashboardFactory'
import { importTelemetrySdkFactory } from './loadTelemetryFactory'
import { importDataSdkFactory } from './loadDataFactory'
import { importElementorySupportSdkFactory } from './loadElementorySupportFactory'

export interface SdkLoaderUtils {
	modelsApi: IModelsAPI
	clientSpecMapApi: ClientSpecMapAPI
	platformEnvData: PlatformEnvData
}

export type WixCodeSdkLoader = (utils: SdkLoaderUtils) => Promise<Function>
type Predicate = (utils: SdkLoaderUtils) => Boolean
type ImportFactory = () => Promise<Function>

type CreateLoader = (predicate: Predicate, importFactory: ImportFactory) => WixCodeSdkLoader

const createLoader: CreateLoader = (predicate, importFactory) => async (utils) => (predicate(utils) ? importFactory() : () => {})

export const wixCodeSdkLoadersNames: Record<string, string> = {
	window: 'windowWixCodeSdk',
	seo: 'seoWixCodeSdk',
	site: 'siteWixCodeSdk',
	siteMembers: 'siteMembersWixCodeSdk',
	location: 'locationWixCodeSdk',
	payments: 'paymentsWixCodeSdk',
	paidPlans: 'paidPlansWixCodeSdk',
	wixEvents: 'wixEventsWixCodeSdk',
	telemetry: 'telemetryWixCodeSdk',
	editor: 'editorWixCodeSdk',
	widget: 'widgetWixCodeSdk',
	data: 'dataWixCodeSdk',
	dashboard: 'dashboardWixCodeSdk',
	elementorySupport: 'elementorySupportWixCodeSdk',
	search: 'searchWixCodeSdk',
	bookings: 'bookingsWixCodeSdk',
	fedops: 'fedopsWixCodeSdk',
	stores: 'storesWixCodeSdk',
	realtime: 'realtimeWixCodeSdk',
	crm: 'crmWixCodeSdk',
	authentication: 'authenticationSdkFactory',
	animations: 'animationsWixCodeSdk',
	private: 'privateWixCodeSdk',
	pricingPlans: 'pricingPlansWixCodeSdk',
	environment: 'environmentWixCodeSdk',
	user: 'siteMembersWixCodeSdk',
	memberNamespace: 'siteMembersWixCodeSdk',
}
export const wixCodeSdkFactories: { [wixCodeSdkName: string]: WixCodeSdkLoader } = {
	windowWixCodeSdk: () => import('./mainSdks' /* webpackChunkName: "mainSdks" */).then((m) => m.WindowSdkFactory),
	seoWixCodeSdk: () => import('./mainSdks' /* webpackChunkName: "mainSdks" */).then((m) => m.SeoSdkFactory),
	siteWixCodeSdk: () => import('./mainSdks' /* webpackChunkName: "mainSdks" */).then((m) => m.SiteSdkFactory),
	siteMembersWixCodeSdk: () => import('./mainSdks' /* webpackChunkName: "mainSdks" */).then((m) => m.SiteMembersSdkFactory),
	locationWixCodeSdk: () => import('./mainSdks' /* webpackChunkName: "mainSdks" */).then((m) => m.LocationSdkFactory),
	environmentWixCodeSdk: () => import('./mainSdks' /* webpackChunkName: "mainSdks" */).then((m) => m.EnvironmentSdkFactory),
	paymentsWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.PaymentsSdkFactory),
	paidPlansWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.PaidPlansSdkFactory),
	wixEventsWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.WixEventsSdkFactory),
	searchWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.SearchSdkFactory),
	bookingsWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.BookingsSdkFactory),
	fedopsWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.FedopsSdkFactory),
	storesWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.WixStoresSdkFactory),
	realtimeWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.RealtimeSdkFactory),
	crmWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.CrmSdkFactory),
	authenticationSdkFactory: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.AuthenticationSdkFactory),
	animationsWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.AnimationsSdkFactory),
	privateWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.PrivateSdkFactory),
	pricingPlansWixCodeSdk: () => import('./nonMainSdks' /* webpackChunkName: "nonMainSdks" */).then((m) => m.PricingPlansSdkFactory),
	widgetWixCodeSdk: createLoader(isWixWidgetEditorRequired, importWidgetSdkFactory),
	editorWixCodeSdk: createLoader(isWixEditorRequired, importEditorSdkFactory),
	dashboardWixCodeSdk: createLoader(isDashboardWixCodeSdkRequired, importDashboardSdkFactory),
	telemetryWixCodeSdk: createLoader(isTelemetryWixCodeSdkRequired, importTelemetrySdkFactory),
	dataWixCodeSdk: createLoader(isWixDataRequired, importDataSdkFactory),
	elementorySupportWixCodeSdk: createLoader(isElementorySupportWixCodeSdkRequired, importElementorySupportSdkFactory),
	nativeMobileWixCodeSdk: () => Promise.resolve(NativeMobileSdkFactory),
}
