import type { IFetchApi, BrowserWindow, IStatus } from '@wix/thunderbolt-symbols'
import type {
	MemberDetailsDTO,
	MemberDetails,
	SocialAuthComponentProps,
	IGetSocialAuthComponentProps,
	ISiteMembersSettings,
	ICaptchaSettings,
	AuthorizedPages,
	IAMPlatformLoginResponse,
} from './types'
import {
	LOGIN_ERROR_CODES,
	SIGN_UP_ERROR_CODES,
	AUTH_RESULT_REASON,
	VERIFICATION_CODE_ERROR_CODES,
	INVISIBLE_CAPTCHA_API_KEY,
	AUTH_METHODS,
} from './constants'
import _ from 'lodash'
import { IBsiManager } from 'feature-business-logger'
import { ISessionManager } from 'feature-session-manager'
import { loadScriptTag, getOpenCaptcha, getRuntimeStyleOverridesManager } from '@wix/thunderbolt-commons'
import { Reason, StateMachineResponse, StatusV2 } from '@wix/ambassador-iam-authentication-v1-authentication/types'

export const memberDetailsFromDTO = (memberDetailsDTO: MemberDetailsDTO): MemberDetails => ({
	id: memberDetailsDTO.id,
	contactId: memberDetailsDTO.contactId,
	emailVerified: memberDetailsDTO.attributes?.emailVerified,
	role: memberDetailsDTO.memberRole,
	owner: memberDetailsDTO.owner,
	loginEmail: memberDetailsDTO.email,
	memberName: memberDetailsDTO.name ?? memberDetailsDTO.attributes?.name ?? '',
	firstName: memberDetailsDTO.attributes?.firstName,
	lastName: memberDetailsDTO.attributes?.lastName,
	imageUrl: memberDetailsDTO.attributes?.imageUrl ?? '',
	nickname: memberDetailsDTO.attributes?.nickname,
	profilePrivacyStatus: memberDetailsDTO.attributes?.privacyStatus,
	slug: memberDetailsDTO.slug,
	status: memberDetailsDTO.status,
	creationDate: memberDetailsDTO.dateCreated,
	lastUpdateDate: memberDetailsDTO.dateUpdated,
	emails: [],
	phones: [],
	addresses: [],
	labels: [],
	groups: [],
	customFields: [],
	revision: '',
})

const statusFromStatusV2 = (status: StatusV2): IStatus => {
	if (status.name === 'ACTIVE') {
		return 'ACTIVE'
	}
	if (status.name === 'PENDING' && status.reasons?.includes(Reason.PENDING_ADMIN_APPROVAL_REQUIRED)) {
		return 'APPLICANT'
	}
	return 'PENDING'
}

export const memberDetailsFromIAMResponse = (response: IAMPlatformLoginResponse): MemberDetails => {
	const { identity, additionalData } = response
	const { identityProfile } = identity!
	return {
		id: identity!.id!,
		contactId: (additionalData?.contactId as { strValue: string })?.strValue,
		emailVerified: !!(additionalData?.emailVerified as { numValue: number })?.numValue,
		role: (additionalData?.role as { strValue: string })?.strValue,
		owner: !!(additionalData?.isOwner as { numValue: number })?.numValue,
		loginEmail: identity?.email?.address ?? identity?.identifiers![0].email ?? '',
		memberName: identityProfile!.nickname!,
		firstName: identityProfile?.firstName!,
		lastName: identityProfile?.lastName!,
		// @ts-expect-error
		imageUrl: identityProfile?.imageUrl,
		nickname: identityProfile?.nickname!,
		profilePrivacyStatus: identityProfile?.privacyStatus!,
		slug: (additionalData?.slug as { strValue: string })?.strValue,
		status: statusFromStatusV2(identity!.status!),
		creationDate: identity!.createdDate?.toString() ?? '',
		lastUpdateDate: identity!.updatedDate?.toString() ?? '',
		emails: [],
		phones: [],
		addresses: [],
		labels: [],
		groups: [],
		customFields: [],
		revision: identity!.revision!,
	}
}

export const hangingPromise = () => new Promise<any>(() => {})

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getPerformFetch = (fetchApi: IFetchApi, requestInit: RequestInit, baseUrl: string) => <T = any>(
	url: string,
	options: Partial<RequestInit> = {}
): Promise<T> => {
	const headers = {
		...requestInit.headers,
		...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
		...options.headers,
		'x-wix-client-artifact-id': 'thunderbolt',
	}
	const optionsWithMergedHeaders = {
		...options,
		...{ headers },
	}

	// TODO: move this transformation into FetchApi
	const absoluteUrl = new URL(url, baseUrl).href

	return fetchApi
		.envFetch(absoluteUrl, { ...requestInit, ...optionsWithMergedHeaders })
		.then(async (response: Response) => {
			const data = await response.json()
			if (!response.ok) {
				// since we can't pass Response object between workers we better transform it now
				throw data
			}

			if (data.errorCode) {
				throw data.errorCode
			}
			return data
		})
}

export const withFallback = <T>(request: () => Promise<T>, fallback: () => T) => {
	try {
		return request()
	} catch (e) {
		return fallback()
	}
}

export const getErrorCode = (error: any) =>
	error?.details?.errorcode ?? error?.details?.errorCode ?? error?.details?.applicationError?.code ?? error

export const isLoginAcceptableError = (error: any) => {
	// In case of approval needed (admin approval / email approval)
	// we cancel the process and this considered an expected error
	if (error === AUTH_RESULT_REASON.CANCELED) {
		return true
	}
	const errorCode = getErrorCode(error)
	return LOGIN_ERROR_CODES.includes(errorCode)
}

export const isSignupAcceptableError = (error: any) => {
	// In case of approval needed (admin approval / email approval)
	// we cancel the process and this considered an expected error
	if (error === AUTH_RESULT_REASON.CANCELED) {
		return true
	}
	const errorCode = getErrorCode(error)
	return SIGN_UP_ERROR_CODES.includes(errorCode)
}

export const isVerificationCodeError = (error: any) => {
	const errorCode = getErrorCode(error)
	return VERIFICATION_CODE_ERROR_CODES.includes(errorCode)
}

const getBsi = (bsiManager?: IBsiManager) => {
	const bsiRaw = bsiManager?.getBsi()
	// The bsi has a weird format: guid|pageNumber, we only need the guid
	return bsiRaw ? bsiRaw.split('|')[0] : '00000000-0000-0000-0000-000000000000'
}

export const getVisitorId = (sessionManager: ISessionManager) =>
	sessionManager.getVisitorId() ?? '00000000-0000-0000-0000-000000000000'
export const _getSocialAuthComponentProps: IGetSocialAuthComponentProps = ({
	config,
	viewerModel,
	sessionManager,
	bsiManager,
	handleSocialLoginResponse,
	isSocialAuthSupported,
	captcha,
	userLanguage,
	reportBi,
	reportSocialAuthStarted,
	useNewSocialFlow,
	translations,
}) => {
	// We don't want the bsi, biVisitorId, and svSession to be cached
	const props: SocialAuthComponentProps = {
		bsi: '00000000-0000-0000-0000-000000000000',
		biVisitorId: '00000000-0000-0000-0000-000000000000',
		svSession: sessionManager.getUserSession()!,
		smCollectionId: config.smcollectionId,
		metaSiteId: viewerModel.site.metaSiteId,
		isSocialAuthSupported,
		// Will be called by the component after mounting the iframe to determine what to send inside via postMessage
		getHostReadyPayload: () => ({
			visitorId: getVisitorId(sessionManager),
			svSession: sessionManager.getUserSession()!,
			bsi: getBsi(bsiManager),
		}),
		openCaptcha: getOpenCaptcha({ captcha, userLanguage }),
		reportBi,
		reportSocialAuthStarted,
		useNewSocialFlow,
		translations,
		onBackendSocialLogin: handleSocialLoginResponse,
	}

	return props
}

const CONTACT_INFO_SYSTEM_FIELDS: Record<string, Object> = {
	id: {},
	firstName: {},
	lastName: {},
	picture: {},
	emails: {},
	addresses: {},
	phones: {},
	labels: {},
}

const CONTACT_INFO_HIDDEN_SYSTEM_FIELDS: Record<string, Object> = {
	emailVerified: {},
	role: {},
	loginEmail: {},
	nickname: {},
	slug: {},
	language: {},
	status: {},
	creationDate: {},
	lastUpdateDate: {},
	lastLoginDate: {},
	profilePrivacyStatus: {},
}

const customFieldType = (value: any) => {
	if (_.isDate(value)) {
		return 'dateValue'
	} else if (Number.isInteger(value)) {
		return 'numValue'
	}
	return 'strValue'
}

export const serializeContactInfo = (rawContactInfo: Record<string, any>) =>
	Object.entries(rawContactInfo).reduce(
		(result: Record<string, any>, [key, value]) => {
			const systemField = CONTACT_INFO_SYSTEM_FIELDS[key]
			const hiddenField = CONTACT_INFO_HIDDEN_SYSTEM_FIELDS[key]
			if (systemField) {
				result[key] = value
			} else if (!hiddenField && key) {
				result.customFields.push({
					name: key,
					[customFieldType(value)]: value,
				})
			}
			return result
		},
		{ customFields: [] }
	)

export const serializeIdentityProfile = (rawContactInfo: Record<string, any>) =>
	Object.entries(rawContactInfo).reduce(
		(result: Record<string, any>, [key, value]) => {
			const systemField = CONTACT_INFO_SYSTEM_FIELDS[key]
			const hiddenField = CONTACT_INFO_HIDDEN_SYSTEM_FIELDS[key]
			if (systemField) {
				result[key] = value
			} else if (!hiddenField && key) {
				result.customFields.push({
					name: key,
					value: {
						[customFieldType(value)]: value,
					},
				})
			}
			return result
		},
		{ customFields: [] }
	)

const getGoogleSdkScriptUrl = (language: string, render: string) =>
	`https://www.google.com/recaptcha/enterprise.js?render=${render}&hl=${language}`

export const googleSdkFactory = (
	browserWindow: BrowserWindow,
	runtimeStyleOverridesManager: ReturnType<typeof getRuntimeStyleOverridesManager>
) => {
	const api = {
		loadScript(language: string, render: string) {
			if (browserWindow?.grecaptcha) {
				return browserWindow.grecaptcha
			}

			return loadScriptTag(getGoogleSdkScriptUrl(language, render))
		},
		showCaptchaBadge() {
			setTimeout(() => {
				runtimeStyleOverridesManager.setItemCssOverrides(
					{ visibility: { value: 'visible' }, 'z-index': { value: 'var(--portals-z-index)' } },
					'.grecaptcha-badge',
					browserWindow as NonNullable<BrowserWindow>
				)
			}, 1000)
		},
		hideCaptchaBadge() {
			runtimeStyleOverridesManager.setItemCssOverrides(
				{ visibility: { value: 'hidden' } },
				'.grecaptcha-badge',
				browserWindow as NonNullable<BrowserWindow>
			)
		},
		setCaptchaBadgeVisibility(shouldShowBadge: boolean) {
			if (shouldShowBadge) {
				return api.showCaptchaBadge()
			}
			api.hideCaptchaBadge()
		},
	}

	return api
}

export const CAPTCHA_SETTINGS_OPTIONS = {
	UNKNOWN: 'UNKNOWN',
	NEVER: 'NEVER',
	SUSPECTED_BOTS_ONLY: 'SUSPECTED_BOTS_ONLY',
	ALWAYS: 'ALWAYS',
}

export const getCaptchaSettings = (smSettings: ISiteMembersSettings): ICaptchaSettings => {
	return {
		invisible: {
			login: smSettings?.loginRecaptchaOption === CAPTCHA_SETTINGS_OPTIONS.SUSPECTED_BOTS_ONLY,
			signup: smSettings?.signupRecaptchaOption === CAPTCHA_SETTINGS_OPTIONS.SUSPECTED_BOTS_ONLY,
		},
		visible: {
			login: smSettings?.loginRecaptchaOption === CAPTCHA_SETTINGS_OPTIONS.ALWAYS,
			signup: smSettings?.signupRecaptchaOption === CAPTCHA_SETTINGS_OPTIONS.ALWAYS,
		},
	}
}

export const getInvisibleCaptchaTokenFactory = (window: BrowserWindow) => (
	action: typeof AUTH_METHODS[keyof typeof AUTH_METHODS]
) => {
	try {
		return window?.grecaptcha?.enterprise?.execute(INVISIBLE_CAPTCHA_API_KEY, {
			action,
		})
	} catch (error) {
		return undefined
	}
}

export const toAuthorizedPages = (protectedPages: {
	mapValue: {
		value: {
			[pageId: string]: {
				strValue: string
			}
		}
	}
}): AuthorizedPages => _.mapValues(protectedPages?.mapValue?.value ?? [], 'strValue')

export const navigateToAuthorization = (
	browserWindow: BrowserWindow,
	requestUrl: string,
	options: Partial<{ sessionToken: string; error: ISSO_ERRORS }>
) => {
	try {
		const postLoginRedirect = getAuthorizationUrl(requestUrl, options)
		if (!postLoginRedirect || !postLoginRedirect.href) {
			return false
		}
		browserWindow?.location.replace(postLoginRedirect.href)
		return true
	} catch {
		return false
	}
}

const getAuthorizationUrl = (requestUrl: string, options: Partial<{ sessionToken: string; error: ISSO_ERRORS }>) => {
	try {
		const authorizationUrl = getRawRedirectUrl(requestUrl, REDIRECT_PARAMS.AUTHORIZATION)
		if (options.sessionToken) {
			authorizationUrl.searchParams.set('sessionToken', options.sessionToken)
		}
		if (options.error) {
			authorizationUrl.searchParams.set('error', options.error)
		}
		// To prevent phishing we don't allow a cross origin redirects
		return new URL(authorizationUrl)
	} catch (_error) {
		console.log('Failed to parse redirect url: ', _error)
		return undefined
	}
}

export const SSO_ERRORS = {
	INVALID_REQUEST: 'invalid_request',
	ACCESS_DENIED: 'access_denied',
	TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
} as const

export type ISSO_ERRORS = typeof SSO_ERRORS[keyof typeof SSO_ERRORS]

export const REDIRECT_PARAMS = {
	AUTHORIZATION: 'authorization_url',
} as const

export type IREDIRECT_PARAMS = typeof REDIRECT_PARAMS[keyof typeof REDIRECT_PARAMS]

export const getRawRedirectUrl = (requestUrl: string, paramName: IREDIRECT_PARAMS) => {
	const url = new URL(requestUrl)
	const postLogin = url.searchParams.get(paramName)
	if (!postLogin) {
		throw new Error('Authorization redirect url missing')
	}
	const postLoginUrl = new URL(postLogin)
	if (postLoginUrl.hostname !== url.hostname) {
		throw new Error('Authorization redirect url not allowed')
	}
	return postLoginUrl
}

export const navigateBackToAuthorization = (requestUrl: string, browserWindow: BrowserWindow): void => {
	try {
		if (!getRawRedirectUrl(requestUrl, REDIRECT_PARAMS.AUTHORIZATION)) {
			return
		}
		browserWindow?.history.back()
	} catch {
		return
	}
}

export const memberDetailsFromIAMResponseV2 = (resultData?: StateMachineResponse): MemberDetails => {
	const { identity, additionalData } = resultData!
	const { identityProfile, metadata } = identity!
	const isOwner = metadata?.tags?.some((tag) => tag === 'owner')
	return {
		id: identity!.id!,
		contactId: (additionalData?.contactId as { strValue: string })?.strValue,
		emailVerified:
			identity?.email?.isVerified ?? !!(additionalData?.emailVerified as { numValue: number })?.numValue,
		role: (additionalData?.role as { strValue: string })?.strValue,
		owner: isOwner ?? false,
		loginEmail: (identity?.identifiers && identity?.identifiers[0]?.email) ?? identity?.email?.address ?? '',
		memberName: identityProfile?.nickname ?? '',
		firstName: identityProfile?.firstName ?? '',
		lastName: identityProfile?.lastName ?? '',
		imageUrl: identityProfile?.picture ?? '',
		nickname: identityProfile?.nickname ?? '',
		profilePrivacyStatus: identityProfile?.privacyStatus ?? '',
		slug: (additionalData?.slug as { strValue: string })?.strValue,
		status: statusFromStatusV2(identity?.status!),
		creationDate: identity?.createdDate?.toString() ?? '',
		lastUpdateDate: identity?.updatedDate?.toString() ?? '',
		emails: identityProfile?.emails ?? [],
		phones: identityProfile?.phones ?? [],
		addresses: [],
		labels: identityProfile?.labels ?? [],
		groups: [],
		customFields: identityProfile?.customFields ?? [],
		revision: identity?.revision ?? '',
	}
}
