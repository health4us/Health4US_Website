import { BiStore, ViewerModel, WixBiSession, Experiments } from '@wix/thunderbolt-symbols'

const frogUrlOverride = (experiments: Experiments, externalBaseUrl: string) => {
	if (!process.env.browser) {
		return {}
	}
	return experiments['specs.thunderbolt.frog_on_user_domain'] ? { frogUrlOverride: externalBaseUrl } : {}
}

const getBiStore = (wixBiSession: WixBiSession, viewerModel: ViewerModel): BiStore => {
	const { rollout: rolloutData, site, experiments } = viewerModel

	const {
		msId: msid,
		viewerSessionId,
		initialTimestamp,
		initialRequestTimestamp,
		dc,
		microPop,
		is_rollout,
		isCached,
		checkVisibility,
		caching,
		isjp,
		btype,
		requestUrl,
		st,
		isSuccessfulSSR,
	} = wixBiSession

	return {
		...frogUrlOverride(experiments, site.externalBaseUrl),
		session_id: site.sessionId,
		is_headless: isjp,
		is_headless_reason: btype,
		viewerSessionId,
		caching,
		checkVisibility,
		msid,
		initialTimestamp,
		initialRequestTimestamp,
		dc,
		microPop,
		is_rollout,
		isCached: isCached ? true : false,
		rolloutData,
		requestUrl,
		st,
		isSuccessfulSSR,
		// TODO fix both this and /packages/feature-business-logger/src/businessLogger.ts
		pageData: {
			pageNumber: 1,
			pageId: '',
			pageUrl: requestUrl,
			isLightbox: false,
		},
		viewerVersion: process.env.browser ? window.thunderboltVersion : process.env.APP_VERSION!,
	}
}

const noop = () => {}
const createNoopLogger = ({ muteErrors } = { muteErrors: false }) => ({
	updatePageNumber: noop,
	updatePageId: noop,
	updateApplicationsMetaSite: noop,
	runAsyncAndReport: <T>(asyncMethod: () => Promise<T> | T) => Promise.resolve(asyncMethod()),
	reportAsyncWithCustomKey: <T>(asyncMethod: () => Promise<T>) => Promise.resolve(asyncMethod()),
	runAndReport: <T>(fn: () => T) => fn(),
	phaseStarted: noop,
	phaseEnded: noop,
	meter: noop,
	appLoaded: noop,
	reportAppLoadStarted: noop,
	captureError: muteErrors
		? noop
		: (...args: any) => {
				console.error(...args)
		  },
	addBreadcrumbToBatch: noop,
	flushBreadcrumbBatch: noop,
	setGlobalsForErrors: noop,
	breadcrumb: noop,
	interactionStarted: noop,
	interactionEnded: noop,
	registerPlatformWidgets: noop,
	addSSRPerformanceEvents: noop,
	getEventsData: () => [],
})

const addTagsFromObject = (scope: any, obj: any) => {
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			scope.setTag(key, obj[key])
		}
	}
}

const extractFingerprints = ({ values }: any) => {
	if (values && values.length) {
		const fingerprints = []
		fingerprints.push(values[0].value)
		fingerprints.push(values[0].type)
		if (values[0].stacktrace && values[0].stacktrace.length) {
			fingerprints.push(values[0].stacktrace[0].function)
		}
		return fingerprints
	}
	return ['noData']
}

const getEnvironment = (fleetCode: number) => {
	if (fleetCode === 0) {
		return 'production'
	} else if (fleetCode === 1) {
		return 'rollout'
	}
	return 'canary'
}

const extractFileNameFromErrorStack = (errorStack: string) => {
	const stackArray = errorStack.match(/([\w-.]+(?:\.js|\.ts))/)
	if (!stackArray || !stackArray.length) {
		return 'anonymous function'
	}
	return stackArray[0].split('.')[0]
}

const shouldFilter = (message: string) => !message

const multipleIncludes = (text: string, values: Array<string>) => {
	return values.some((val) => {
		return text.includes(val)
	})
}

export {
	multipleIncludes,
	getBiStore,
	createNoopLogger,
	addTagsFromObject,
	extractFingerprints,
	getEnvironment,
	extractFileNameFromErrorStack,
	shouldFilter,
	frogUrlOverride,
}
