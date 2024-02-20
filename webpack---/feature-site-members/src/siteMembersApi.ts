import { named, withDependencies, optional } from '@wix/thunderbolt-ioc'
import {
	Fetch,
	IFetchApi,
	ILogger,
	IPropsStore,
	IStructureAPI,
	LoggerSymbol,
	Props,
	SiteFeatureConfigSymbol,
	StructureAPI,
	ViewerModel,
	ViewerModelSym,
	ILanguage,
	BrowserWindowSymbol,
	BrowserWindow,
	MasterPageFeatureConfigSymbol,
	WixBiSessionSymbol,
	WixBiSession,
	BusinessLoggerSymbol,
	LanguageSymbol,
	CurrentRouteInfoSymbol,
	Experiments,
	ExperimentsSymbol,
	FeatureStateSymbol,
	CaptchaApiSymbol,
	ICyclicTabbing,
	FeatureExportsSymbol,
} from '@wix/thunderbolt-symbols'
import { isSSR, getRuntimeStyleOverridesManager, getOpenCaptcha, ICaptchaApi } from '@wix/thunderbolt-commons'
import { ISessionManager, SessionManagerSymbol } from 'feature-session-manager'
import { Router, IRouter, IUrlHistoryManager, UrlHistoryManagerSymbol, ICurrentRouteInfo } from 'feature-router'
import { ISiteScrollBlocker, SiteScrollBlockerSymbol } from 'feature-site-scroll-blocker'
import { ILightbox, LightboxSymbol } from 'feature-lightbox'
import { IReporterApi, ReporterSymbol } from 'feature-reporter'
import { getHeadlessClientId } from '@wix/wix-to-headless-redirect-client'
import { uniqueId, partition } from 'lodash'
import {
	INTERACTIONS /* , DIALOGS, NOTIFICATIONS */,
	AUTH_RESULT_REASON,
	UNSUPPORTED_AGENTS_FOR_SOCIAL_AUTH,
	INVISIBLE_CAPTCHA_API_KEY,
	TRACK_EVENTS,
	getTrackEventParams,
	AUTH_METHODS,
	ERROR_CODES,
	CAPTCHA_REQUIRED_RESPONSE,
	newIAMResetPasswordTokenPrefix,
	idpConnectionIdToVendorNames,
	KNOWN_CONNECTION_APPEFIDS,
} from './constants'
import { CommonProps, getDialogService, VerificationCodeProps } from './dialogService'
import { name } from './symbols'
import type {
	AuthenticationToken,
	IContactInfo,
	ISiteMembersApi,
	LoginOptions,
	LoginResult,
	MemberDetails,
	SiteMembersSiteConfig,
	SiteMembersMasterPageConfig,
	ViewModeProp,
	SocialAuthComponentProps,
	ILoginOptions,
	ISignUpOptions,
	RequestAuthorizedPagesResult,
	AuthorizedPages,
	RegisterResult,
	SiteMembersState,
	IEmailVerification,
	IAMPlatformLoginResponse,
	IShowAuthPageOptions,
	GetMyMemberResponse,
	GetMemberRoleResponse,
} from './types'
import { Role } from './types'
import {
	sleep,
	getVisitorId,
	getPerformFetch,
	googleSdkFactory,
	memberDetailsFromDTO,
	isLoginAcceptableError,
	isSignupAcceptableError,
	_getSocialAuthComponentProps,
	getInvisibleCaptchaTokenFactory,
	toAuthorizedPages,
	serializeIdentityProfile,
	SSO_ERRORS,
	navigateToAuthorization,
	navigateBackToAuthorization,
	getErrorCode,
	withFallback,
	memberDetailsFromIAMResponseV2,
	memberDetailsFromIAMResponse,
	hangingPromise,
} from './utils'
import { BsiManagerSymbol, BusinessLogger, IBsiManager } from 'feature-business-logger'
import { CyclicTabbingSymbol } from 'feature-cyclic-tabbing'
import { BIEvents } from './biEvents'
import { SMPopups } from './smPopups'
import { IFeatureState } from 'thunderbolt-feature-state'
import { SiteMembersSettingsService } from './smSettings'
import { createCommunityService, createMemberPrivacySettingsService, getCommunityOptions } from './communityUtils'
import { IFeatureExportsStore } from 'thunderbolt-feature-exports'
import { toMemberDetails } from './mapper'
import { createHttpClient } from '@wix/http-client'
import { loginV2, registerV2, logout } from '@wix/ambassador-iam-authentication-v1-authentication/http'
import { createSessionCookie } from '@wix/ambassador-iam-cookie-v1-cookie/http'
import {
	CaptchaToken,
	PrivacyStatus,
	StateMachineResponse,
	LoginV2Request,
	RegisterV2Request,
	StateType,
	StatusName,
} from '@wix/ambassador-iam-authentication-v1-authentication/types'
import { verifyDuringAuthentication } from '@wix/ambassador-iam-verification-v1-start-response/http'

// While our `login`,`register` and related functions don't officially support returning authorized
// pages, we know that our implementation is capable of doing so, if explicitly requested.
// We use this internal type to convey this information only within this file so that we can use
// this hidden `pages` result throughout our implementation.
type ExtendedLoginResult = LoginResult & { pages?: AuthorizedPages }
type ExtendedRegisterResult = RegisterResult & { pages?: AuthorizedPages }

const siteMembersApi = (
	siteFeatureConfig: SiteMembersSiteConfig,
	siteMembersMasterPageConfig: SiteMembersMasterPageConfig,
	featureState: IFeatureState<SiteMembersState>,
	siteMembersExports: IFeatureExportsStore<typeof name>,
	fetchApi: IFetchApi,
	logger: ILogger,
	viewerModel: ViewerModel,
	sessionManager: ISessionManager,
	propsStore: IPropsStore,
	structureApi: IStructureAPI,
	language: ILanguage,
	browserWindow: BrowserWindow,
	router: IRouter,
	siteScrollBlocker: ISiteScrollBlocker,
	urlHistoryManager: IUrlHistoryManager,
	businessLogger: BusinessLogger,
	wixBiSession: WixBiSession,
	popups: ILightbox | undefined,
	reporter: IReporterApi = { trackEvent: () => 0 },
	currentRouteInfo: ICurrentRouteInfo,
	experiments: Experiments,
	captcha: ICaptchaApi,
	cyclicTabbing: ICyclicTabbing,
	bsiManager?: IBsiManager
): ISiteMembersApi => {
	const runtimeStyleOverridesManager = getRuntimeStyleOverridesManager()
	const {
		loginSocialBarOnSite,
		protectedHomepage,
		smSessionCookie,
		memberInfoAppId,
		membersInfoAppDefId,
		smcollectionId,
		isTemplate,
	} = siteFeatureConfig
	let { sm_efCookie } = siteFeatureConfig
	const metasiteAppDefinitionId = '22bef345-3c5b-4c18-b782-74d4085112ff'
	const svSession = sessionManager.getUserSession()!
	let metasiteInstance = sessionManager.getAppInstanceByAppDefId(metasiteAppDefinitionId)
	const getMetaSiteInstance = () => metasiteInstance ?? ''
	const getBiVisitorId = () => getVisitorId(sessionManager)

	const deprecateAppIdExperimentOn = experiments['specs.thunderbolt.deprecateAppId']

	const {
		smSettings,
		tpaAppDefinitionIds,
		tpaApplicationIds,
		policyLinks,
		translations,
	} = siteMembersMasterPageConfig

	const isMemberInfoPage = deprecateAppIdExperimentOn
		? tpaAppDefinitionIds![membersInfoAppDefId!]
		: memberInfoAppId && tpaApplicationIds![memberInfoAppId]

	const {
		metaSiteId,
		externalBaseUrl,
		siteId: viewerModelSiteId,
		siteRevision: viewerModelSiteRevision,
	} = viewerModel.site
	const requestUrl = viewerModel.requestUrl
	const viewMode = viewerModel.viewMode
	const siteId = viewerModel.anywhereConfig?.siteId ?? viewerModelSiteId
	const siteRevision = viewerModel.anywhereConfig?.revision ?? viewerModelSiteRevision

	const isUnsupportedAgentForSocialAuth =
		UNSUPPORTED_AGENTS_FOR_SOCIAL_AUTH.findIndex((ua) => browserWindow?.navigator?.userAgent?.includes(ua)) !== -1
	const isSocialAuthSupported = !isUnsupportedAgentForSocialAuth
	const isCustomLoginSocialAuthSupported = !isUnsupportedAgentForSocialAuth
	const authenticateSessionUrl = `/_api/wix-sm-webapp/tokens/verify/${metaSiteId}/${siteId}`
	const authorizeMemberPagesUrl = `${externalBaseUrl.replace(/\/$/, '')}/api/wix-sm/v1/authorize/${siteId}/pages`
	const logoutUrl = `/_api/wix-sm-webapp/tokens/logout/${metaSiteId}`
	const sendResetPasswordEmailUrl = '/_api/wix-sm-webapp/member/sendForgotPasswordMail'
	const changePasswordUrl = `/_api/wix-sm-webapp/member/changePasswordWithMailToken?metaSiteId=${metaSiteId}&collectionId=${smcollectionId}`
	const sendSetPasswordEmailUrl = '/_api/wix-sm-webapp/members/v1/auth/members/send-set-password-email'
	const resendEmailVerificationUrl = '/_api/wix-sm-webapp/tokens/email/resend'
	const iamPlatformSendResetPasswordEmailUrl = '/_api/iam/recovery/v1/send-email'
	const iamPlatformChangePasswordUrl = `/_api/iam/recovery/v1/recover`
	const stateMachineServiceUrl = '/_api/iam/state-machine-service'

	const defaultDialog = smSettings.smFirstDialogLogin ? 'login' : 'signup'
	const {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		socialLoginFacebookEnabled,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		socialLoginGoogleEnabled,
		termsOfUse,
		privacyPolicy,
		codeOfConduct,
		customSignUpPageId,
		customSignInPageId,
	} = smSettings
	const { privacyNoteType, joinCommunityCheckedByDefault } = getCommunityOptions(smSettings, experiments)

	let { smToken } = siteFeatureConfig
	let memberDetails = {} as MemberDetails
	let savedSessionToken = smSessionCookie
	let appDidMountCallback: (() => void) | null = null
	let appMounted = false

	const registerToAppDidMount = (cb: () => void) => {
		appDidMountCallback = cb
	}

	const getDialogOptions = () => {
		return {
			registerToAppDidMount,
			shouldWaitForAppDidMount: !appMounted,
		}
	}

	const _getMemberDetails = async (): Promise<MemberDetails> => {
		if (experiments['specs.thunderbolt.getMemberDetailsFromMembersNg']) {
			const { member } = await performFetch<GetMyMemberResponse>('/_api/members/v1/members/my?fieldsets=FULL', {
				headers: {
					authorization: sessionManager.getAppInstanceByAppDefId(metasiteAppDefinitionId) ?? '',
				},
			})
			const { role } = await withFallback(
				() =>
					performFetch<GetMemberRoleResponse>(`/api/wix-sm/v1/members/${member?.id}/role`, {
						headers: {
							authorization: sessionManager.getAppInstanceByAppDefId(metasiteAppDefinitionId) ?? '',
						},
					}),
				() => ({ role: Role.MEMBER })
			)
			return toMemberDetails({ member, role })
		}

		const getMemberDetailsUrl = `/_api/wix-sm-webapp/member/${smToken}?collectionId=${smcollectionId}&metaSiteId=${metaSiteId}`
		const { payload } = await performFetch(getMemberDetailsUrl)
		return memberDetailsFromDTO(payload)
	}

	const onLoginCallbacks: { [callbackId: string]: (user: MemberDetails) => void } = {}
	const triggerLoginCallbacks = (callbackMemberDetails: MemberDetails) => {
		return Promise.all(
			Object.entries(onLoginCallbacks).map(async ([callbackId, cb]) => {
				try {
					const result = await Promise.race([
						cb(callbackMemberDetails),
						sleep(3000).then(() => '$$$timeout$$$'),
					])

					if (result === '$$$timeout$$$') {
						throw new Error(`callback ${callbackId} timed out`)
					}
				} catch (e) {
					logger.captureError(e as Error, { tags: { feature: 'site-members' } })
				}
			})
		)
	}
	const onLogoutCallbacks: { [callbackId: string]: () => void } = {}
	const triggerLogoutCallbacks = () => {
		return Promise.all(
			Object.entries(onLogoutCallbacks).map(async ([callbackId, cb]) => {
				try {
					const result = await Promise.race([cb(), sleep(3000).then(() => '$$$timeout$$$')])

					if (result === '$$$timeout$$$') {
						throw new Error(`callback ${callbackId} timed out`)
					}
				} catch (e) {
					logger.captureError(e as Error, { tags: { feature: 'site-members' } })
				}
			})
		)
	}

	const biEvents = BIEvents({
		sessionManager,
		businessLogger,
		wixBiSession,
		viewMode: viewMode?.toUpperCase() as ViewModeProp,
		language,
	})
	biEvents.siteMembersFeatureLoaded()
	const onMemberDetailsRefresh: { [callbackId: string]: (user: MemberDetails) => void } = {}
	const triggerOnMemberDetailsRefreshCallbacks = (callbackMemberDetails: MemberDetails) => {
		return Promise.all(
			Object.values(onMemberDetailsRefresh).map(async (cb) => {
				try {
					await cb(callbackMemberDetails)
				} catch (e) {
					logger.captureError(e as Error, { tags: { feature: 'site-members' } })
				}
			})
		)
	}

	const performFetch = getPerformFetch(
		fetchApi,
		{
			credentials: 'same-origin',
			headers: {
				accept: 'application/json',
				'x-wix-site-revision': `${siteRevision}`,
				'x-wix-client-artifact-id': 'thunderbolt',
			},
		},
		requestUrl
	)
	const httpClient = createHttpClient({ isSSR: !process.env.browser && !experiments.httpClientNeverSsr })
	const memberPrivacySettingsService = createMemberPrivacySettingsService(httpClient, getMetaSiteInstance)
	const communityService = createCommunityService(memberPrivacySettingsService, siteFeatureConfig, experiments)

	const dialogService = getDialogService(propsStore, structureApi, siteScrollBlocker, browserWindow, cyclicTabbing)
	const params = new URL(requestUrl).searchParams
	const queryParams: { [paramKey: string]: string } = {}
	params.forEach((value, key) => {
		queryParams[key] = value
	})
	const clientId = getHeadlessClientId({ query: queryParams })
	const siteMembersSettingsService = SiteMembersSettingsService(
		performFetch,
		logger,
		reporter,
		experiments,
		() => metasiteInstance ?? '',
		clientId
	)
	const getInvisibleCaptchaToken = getInvisibleCaptchaTokenFactory(browserWindow)
	const googleSdk = googleSdkFactory(browserWindow, runtimeStyleOverridesManager)

	const smPopups = new SMPopups(popups, async () => {
		const captchaSettings = await siteMembersSettingsService.getCaptchaSettings()
		if (!captchaSettings.invisible.login && !captchaSettings.invisible.signup) {
			return
		}

		googleSdk.hideCaptchaBadge()
	})
	const bsiRaw = bsiManager?.getBsi()
	// The bsi has a weird format: guid|pageNumber, we only need the guid
	const bsi = bsiRaw ? bsiRaw.split('|')[0] : '00000000-0000-0000-0000-000000000000'
	const reportSocialAuthStarted = (vendor: string) => {
		logger.interactionStarted(INTERACTIONS.SOCIAL_APP_LOGIN_WITH_VENDOR(vendor))
	}
	const api = {
		appDidMount() {
			if (appDidMountCallback) {
				appDidMountCallback()
			}
			appMounted = true
		},
		async handleSocialLoginResponse(
			payload: IAMPlatformLoginResponse,
			idpConnectionId: string,
			returnPages: boolean = false
		): Promise<ExtendedLoginResult> {
			const vendor = idpConnectionIdToVendorNames[idpConnectionId] ?? idpConnectionId
			// Login has already fully happened on the server at this point, so it makes sense
			// to log a complete interaction without waiting for anything.
			// This "noop" interaction and event pair is still needed to maintain compatibility
			// with the other form of social login as implemented in handleOauthToken above
			logger.interactionStarted(INTERACTIONS.SOCIAL_APP_LOGIN)
			logger.interactionEnded(INTERACTIONS.SOCIAL_APP_LOGIN)
			logger.interactionEnded(INTERACTIONS.SOCIAL_APP_LOGIN_WITH_VENDOR(vendor))
			reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.LOGIN.SUBMIT, vendor))

			if (!experiments['specs.thunderbolt.useNewPostLoginRedirect']) {
				navigateToAuthorization(browserWindow, requestUrl, {})
			}

			const loginResult = await api.handleIAMLoginResponseV1(payload, returnPages)

			reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.LOGIN.SUCCESS, vendor))

			return loginResult
		},
		async handleIAMLoginResponseV1(
			loginResponse: IAMPlatformLoginResponse,
			returnPages: boolean = false
		): Promise<ExtendedLoginResult> {
			if (loginResponse.identity?.status?.name === StatusName.PENDING) {
				// In case member need to wait for admin approval
				return api.showAdminApprovalDialog(
					loginResponse.identity.email?.address ?? ''
				) as Promise<ExtendedLoginResult>
			}

			const member = memberDetailsFromIAMResponse(loginResponse)
			const token = loginResponse.sessionToken as string
			const pages = toAuthorizedPages(loginResponse.additionalData?.protectedPages as any)

			const redirected = navigateToAuthorization(browserWindow, requestUrl, { sessionToken: token })
			if (redirected && experiments['specs.thunderbolt.useNewPostLoginRedirect']) {
				return hangingPromise()
			}

			const returnedPages = (await api.applySessionToken(
				token,
				member,
				returnPages && !pages,
				!!pages
			)) as AuthorizedPages
			const resolvedPages = pages ?? returnedPages

			return { sessionToken: token, member, ...(returnPages ? { pages: resolvedPages } : {}) }
		},
		async promptLogin(
			loginOptions: Partial<LoginOptions> = {},
			isCloseable: boolean = smPopups.config?.isCloseable ?? true,
			returnPages: boolean = smPopups.config?.returnPages ?? false
		): Promise<ExtendedLoginResult> {
			const { mode, modal } = loginOptions
			const modeToDisplay = mode ?? defaultDialog
			const isLoginMode = modeToDisplay === 'login'
			const displayMode = modal ? 'popup' : 'fullscreen'
			// In case of previewing a template site we don't want to present the login/signup view but a notification
			if (isTemplate) {
				await api.showNotificationDialog(
					translations.templateNotificationTitle,
					translations.templateNotificationMessage,
					translations.containerOk
				)
				return Promise.reject(AUTH_RESULT_REASON.CANCELED)
			}
			googleSdk.loadScript(language.userLanguage, INVISIBLE_CAPTCHA_API_KEY)

			if (isLoginMode) {
				return api.showLoginDialog({ isCloseable, displayMode, returnPages })
			} else {
				return api.showSignUpDialog({ isCloseable, displayMode, returnPages })
			}
		},
		promptForgotPassword(isCloseable: boolean = true): Promise<void> {
			return new Promise((resolve, reject) => {
				smPopups.assignRequestAuthenticationPromise(resolve, reject)
				const props: CommonProps = {
					isCloseable,
					directionByLanguage: language.directionByLanguage,
					translations,
				}
				const actions = {
					async onCloseDialogCallback() {
						navigateBackToAuthorization(requestUrl, browserWindow)
						biEvents.closingDialog('RequestResetPassword')
						dialogService.hideDialog()
						smPopups.rejectAuthenticationRequest()
					},
					onSubmitCallback(email: string) {
						return api.sendForgotPasswordMail(email).then(async () => {
							const close = () => {
								navigateBackToAuthorization(requestUrl, browserWindow)
								smPopups.resolveAuthenticationRequest()
								reject(AUTH_RESULT_REASON.CANCELED)
							}

							api.showNotificationDialog(
								translations.resetPasswordCheckEmailTitle,
								translations.resetPasswordCheckEmailText,
								translations.resetPasswordOk,
								close,
								close
							)
						})
					},
				}
				const options = getDialogOptions()

				dialogService.displayDialog('RequestPasswordResetDialog', props, actions, options)
			})
		},
		/**
		 * @deprecated this has been superceded by requestAuthorizedPages and can be removed when we merge specs.thunderbolt.newAuthorizedPagesFlow
		 */
		async requestAuthentication(
			loginOptions: Partial<LoginOptions> = {}
		): Promise<{
			success: boolean
			token?: AuthenticationToken
			reason: string
		}> {
			if (savedSessionToken) {
				return { success: true, token: savedSessionToken, reason: AUTH_RESULT_REASON.ALREADY_LOGGED_IN }
			}

			try {
				// The dialog is not closeable if and only if the homepage is protected and login was prompted by navigation
				const isCloseable = !protectedHomepage
				const { sessionToken } = await api.promptLogin(loginOptions, isCloseable)
				return { success: true, token: sessionToken, reason: AUTH_RESULT_REASON.SUCCESS }
			} catch (reason) {
				return { success: false, reason: reason as string }
			}
		},
		// If a member is logged in, explictly request their authorized pages using `smToken` as the
		// auth header.
		// Otherwise, log the member in and return the authorized pages the can optionally be extracted
		// from the login process.
		async requestAuthorizedPages(loginOptions: Partial<LoginOptions> = {}): Promise<RequestAuthorizedPagesResult> {
			if (smToken) {
				const pages = await api.authorizeMemberPagesBySignedInstance(smToken)
				return {
					success: true,
					pages,
				}
			}

			try {
				// The dialog is not closeable if and only if the homepage is protected and login was prompted by navigation
				const isCloseable = !protectedHomepage
				smPopups.setConfig({ isCloseable, returnPages: true })
				const data = await api.promptLogin(loginOptions, isCloseable, true)
				smPopups.reset()
				return { success: true, pages: data.pages! }
			} catch (reason) {
				return { success: false, reason: reason as string }
			}
		},
		async applySessionToken(
			token: string,
			newMemberDetails?: MemberDetails,
			returnPages: boolean = false,
			useIAMPlatform: boolean = false
		): Promise<void | AuthorizedPages> {
			logger.interactionStarted(INTERACTIONS.VERIFY_TOKEN)
			useIAMPlatform = !!(useIAMPlatform || experiments['specs.thunderbolt.alwaysApplySessionTokenOnIAM'])
			const response = await (useIAMPlatform
				? httpClient
						.request(createSessionCookie({ sessionToken: token, protectedPages: returnPages }), {
							signedInstance: metasiteInstance || '',
						})
						.then((r) => r.data)
						.catch((error) => {
							throw error.response?.data ?? error
						})
				: performFetch(authenticateSessionUrl, {
						method: 'POST',
						body: `token=${token}`,
				  }).then((r) => r.payload))

			logger.interactionEnded(INTERACTIONS.VERIFY_TOKEN)

			await sessionManager.loadNewSession({ reason: 'memberLogin' })

			metasiteInstance = sessionManager.getAppInstanceByAppDefId(metasiteAppDefinitionId)
			smToken = sessionManager.getSmToken() as string
			savedSessionToken = token

			memberDetails = newMemberDetails ?? ((await api.getMemberDetails()) as MemberDetails)

			await triggerLoginCallbacks(memberDetails)
			siteMembersExports.export({ memberDetails })
			if (returnPages) {
				const pages = useIAMPlatform ? toAuthorizedPages(response.protectedPages) : response.pages
				return pages as AuthorizedPages
			}
		},
		/**
		 * @deprecated this has been superceded by authorizeMemberPagesBySignedInstance and can be removed when we merge specs.thunderbolt.newAuthorizedPagesFlow
		 */
		async authorizeMemberPagesByCookie(): Promise<AuthorizedPages> {
			const options = isSSR(browserWindow)
				? {
						headers: {
							cookie: `smSession=${smSessionCookie}`,
						},
				  }
				: undefined
			const { authorizedPages } = await performFetch(authorizeMemberPagesUrl, options)

			return authorizedPages
		},
		/**
		 * @deprecated this has been superceded by authorizeMemberPagesBySignedInstance and can be removed when we merge specs.thunderbolt.newAuthorizedPagesFlow
		 */
		async authorizeMemberPagesByToken(token: string): Promise<AuthorizedPages> {
			// Due to a design flaw, we may sometime be provided with a token that's not valid
			// for this endpoint. This happens when the member is already logged in and the token
			// is the same as the one we have saved in the smSession cookie. In this case we 'cheat'
			// and delegate to authorizeMemberPagesByCookie which works fine with this token, provided
			// that it's sent via cookie.
			if (token === smSessionCookie) {
				return this.authorizeMemberPagesByCookie()
			}

			const { payload } = await performFetch(authenticateSessionUrl, {
				method: 'POST',
				body: `token=${token}`,
			})

			const { pages } = payload

			return pages
		},
		async authorizeMemberPagesBySignedInstance(instance: string): Promise<AuthorizedPages> {
			const options = {
				headers: {
					authorization: instance,
				},
			}
			const { authorizedPages } = await performFetch(authorizeMemberPagesUrl, options)

			return authorizedPages
		},
		async getMemberDetails(refreshCurrentMember: boolean = false): Promise<MemberDetails | null> {
			if (memberDetails.id && !refreshCurrentMember) {
				return memberDetails
			} else if (smToken) {
				memberDetails = await _getMemberDetails()
				siteMembersExports.export({ memberDetails })

				if (refreshCurrentMember) {
					await triggerOnMemberDetailsRefreshCallbacks(memberDetails)
				}

				return memberDetails
			}

			return null
		},
		async sendForgotPasswordMail(email: string) {
			logger.interactionStarted(INTERACTIONS.RESET_PASSWORD)
			const userLanguage = language.userLanguage
			const encodedRequestUrl = encodeURIComponent(requestUrl)
			const encodedEmail = encodeURIComponent(email)
			const url = experiments['specs.thunderbolt.iamResetPasswordFlow']
				? iamPlatformSendResetPasswordEmailUrl
				: sendResetPasswordEmailUrl
			const body = experiments['specs.thunderbolt.iamResetPasswordFlow']
				? JSON.stringify({ language: userLanguage, email, redirect: { url: requestUrl } })
				: `returnUrl=${encodedRequestUrl}&collectionId=${smcollectionId}&metaSiteId=${metaSiteId}&lang=${userLanguage}&email=${encodedEmail}`
			const headers = experiments['specs.thunderbolt.iamResetPasswordFlow']
				? {
						'Content-Type': 'application/json',
						authorization: metasiteInstance || '',
				  }
				: undefined
			await performFetch(url, {
				headers,
				method: 'POST',
				body,
			})

			logger.interactionEnded(INTERACTIONS.RESET_PASSWORD)
		},
		async sendSetPasswordEmail(email: string, options?: { hideIgnoreMessage?: boolean }): Promise<boolean> {
			const response = await performFetch(sendSetPasswordEmailUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: metasiteInstance || '',
				},
				body: JSON.stringify({
					email,
					...(options?.hideIgnoreMessage ? { hideIgnoreMessage: options.hideIgnoreMessage } : {}),
				}),
			})

			return !!response?.accepted
		},
		async changePassword(newPassword: string, token: string) {
			const encodedNewPassword = encodeURIComponent(newPassword)
			const isNewIAMPasswordFlow = token.startsWith(newIAMResetPasswordTokenPrefix)
			const url = isNewIAMPasswordFlow ? iamPlatformChangePasswordUrl : changePasswordUrl
			const body = isNewIAMPasswordFlow
				? JSON.stringify({ password: newPassword, recovery_token: token })
				: `newPassword=${encodedNewPassword}&forgotPasswordToken=${token}`
			const headers = isNewIAMPasswordFlow
				? {
						'Content-Type': 'application/json',
						authorization: metasiteInstance || '',
				  }
				: undefined
			await performFetch(url, {
				method: 'POST',
				headers,
				body,
			})
		},
		async resendEmailVerification(memberId: string) {
			await performFetch(`${resendEmailVerificationUrl}/${memberId}`)
		},
		async logout(redirectToUrl?: string) {
			if (!smToken) {
				return
			}

			if (experiments['specs.thunderbolt.logoutOnIAM']) {
				await httpClient.request(logout({}), { signedInstance: metasiteInstance || '' }).catch(() => {
					reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.LOGOUT.FAIL))
				})
			} else {
				await performFetch(logoutUrl, {
					method: 'POST',
				}).catch(() => {
					reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.LOGOUT.FAIL))
				})
			}

			await triggerLogoutCallbacks()

			if (redirectToUrl) {
				const relativeUrl = `./${redirectToUrl.replace(/^\//, '')}`

				await router.navigate(relativeUrl)
			}

			if (!isSSR(browserWindow)) {
				browserWindow.document.location.reload()
			}
		},
		registerToUserLogin(
			callback: (user: MemberDetails) => any,
			callbackId: string = uniqueId(
				'callback'
			) /* This specific prefix is added to maintain compat with previous implementation*/
		): string {
			onLoginCallbacks[callbackId] = callback
			return callbackId
		},
		unRegisterToUserLogin(callbackId: string): void {
			delete onLoginCallbacks[callbackId]
		},
		registerToMemberLogout(callback: () => any): string {
			const callbackId = uniqueId('logout_callback')
			onLogoutCallbacks[callbackId] = callback
			return callbackId
		},
		unRegisterToMemberLogout(callbackId: string): void {
			delete onLogoutCallbacks[callbackId]
		},
		registerToMemberDetailsRefresh(callback: (user: MemberDetails) => any): string {
			const callbackId = uniqueId('mdrcb')
			onMemberDetailsRefresh[callbackId] = callback
			return callbackId
		},
		unRegisterToMemberDetailsRefresh(callbackId: string): void {
			delete onMemberDetailsRefresh[callbackId]
		},
		async showWelcomeDialog(isCloseable: boolean = true) {
			const props: CommonProps = {
				isCloseable,
				translations,
			}

			const url = urlHistoryManager.getParsedUrl()
			const actions = {
				onCloseDialogCallback() {
					navigateBackToAuthorization(requestUrl, browserWindow)
					biEvents.closingDialog('WelcomeDialog')
					const urlHostname = new URL(requestUrl).hostname
					const hostName = urlHostname.indexOf('www') === 0 ? urlHostname.substr(3) : urlHostname
					clearCookie('sm_ef', '/', hostName)
					sm_efCookie = ''
					dialogService.hideDialog()
					router.navigate(url.href)
				},
				onSubmitCallback() {
					const urlHostname = new URL(requestUrl).hostname
					const hostName = urlHostname.indexOf('www') === 0 ? urlHostname.substr(3) : urlHostname
					clearCookie('sm_ef', '/', hostName)
					sm_efCookie = ''
					dialogService.hideDialog()
					if (isMemberInfoPage) {
						// FIXME: We should navigate to memberInfoPage somehow, not to this hardcoded url
						router.navigate('./account/my-account')
					}
					router.navigate(url.href)
				},
			}

			logger.interactionStarted(INTERACTIONS.WELCOME_DIALOG)
			logger.interactionEnded(INTERACTIONS.WELCOME_DIALOG)
			dialogService.displayDialog('WelcomeDialog', props, actions)
		},
		async showNoPermissionsToPageDialog(onCloseCallback?: () => any) {
			const actions = {
				onCloseDialogCallback() {
					navigateBackToAuthorization(requestUrl, browserWindow)
					dialogService.hideDialog()
					if (onCloseCallback) {
						onCloseCallback()
					}
				},
				onSwitchAccountLinkClick() {
					api.logout()
				},
			}

			dialogService.displayDialog(
				'NoPermissionsToPageDialog',
				{
					translations,
				},
				actions
			)
		},
		async showResetPasswordDialog(token: string) {
			const props = {
				isCloseable: true,
				isTermsOfUseNeeded: !!(termsOfUse?.enabled && policyLinks.termsOfUse),
				isPrivacyPolicyNeeded: !!(privacyPolicy?.enabled && policyLinks.privacyPolicy),
				termsOfUseLink: policyLinks.termsOfUse,
				privacyPolicyLink: policyLinks.privacyPolicy,
				directionByLanguage: language.directionByLanguage,
				translations,
			}

			const clearResetPasswordHistory = () => {
				const url = urlHistoryManager.getParsedUrl()
				url.searchParams.delete('forgotPasswordToken')
				url.searchParams.delete('forgotPasswordLang')
				urlHistoryManager.pushUrlState(url)
				return url
			}

			const actions = {
				onCloseDialogCallback() {
					navigateBackToAuthorization(requestUrl, browserWindow)
					biEvents.closingDialog('ResetPasswordDialog')
					const url = clearResetPasswordHistory()

					dialogService.hideDialog()
					router.navigate(url.href)
				},
				async onSubmitCallback(newPassword: string) {
					try {
						await api.changePassword(newPassword, token)
						api.showNotificationDialog(
							translations.resetPasswordSuccessTitle,
							'',
							translations.containerOk,
							async () => {
								if (token.startsWith(newIAMResetPasswordTokenPrefix)) {
									const url = new URL(requestUrl)
									const redirectUrl = url.searchParams.get('redirectUrl')
									if (redirectUrl) {
										return browserWindow?.location.replace(redirectUrl)
									}
								}
								const url = clearResetPasswordHistory()
								await api.showLoginDialog()
								router.navigate(url.href)
							}
						)
					} catch (error) {
						const errorCode = getErrorCode(error).toString()
						if (
							errorCode !== ERROR_CODES.RESET_PASSWORD_TOKEN_EXPIRED &&
							errorCode !== ERROR_CODES.NEW_RESET_PASSWORD_TOKEN_EXPIRED
						) {
							throw error
						}
						api.showNotificationDialog(
							translations.passwordHasExpiredTitle,
							translations.passwordHasExpiredText,
							translations.passwordHasExpiredOk,
							() =>
								api.promptForgotPassword(props.isCloseable).then(() => {
									const url = urlHistoryManager.getParsedUrl()
									router.navigate(url.href)
								})
						)
					}
				},
			}
			dialogService.displayDialog('ResetPasswordDialog', props, actions, getDialogOptions())
		},
		async showLoggedInResetPasswordDialog() {
			const props = {
				isCloseable: true,
				directionByLanguage: language.directionByLanguage,
				translations,
			}

			const actions = {
				onCloseDialogCallback() {
					biEvents.closingDialog('LoggedInResetPasswordDialog')

					dialogService.hideDialog()
				},
				async onSubmitCallback() {},
			}
			dialogService.displayDialog('LoggedInResetPasswordDialog', props, actions, getDialogOptions())
		},
		async showLoginDialog(options: IShowAuthPageOptions = {}, serverError?: any): Promise<ExtendedLoginResult> {
			const { returnPages, isCloseable, displayMode } = {
				isCloseable: true,
				displayMode: 'fullscreen' as IShowAuthPageOptions['displayMode'],
				returnPages: false,
				...options,
			}

			const captchaSettings = await siteMembersSettingsService.getCaptchaSettings()
			googleSdk.setCaptchaBadgeVisibility(captchaSettings.invisible.login)
			if (customSignInPageId && popups?.isLightbox(customSignInPageId)) {
				return api.showCustomAuthenticationDialog(customSignInPageId, returnPages)
			}

			return new Promise(async (resolve, reject) => {
				smPopups.assignRequestAuthenticationPromise(resolve, reject)
				const shouldForceCaptchaVerificationFT =
					experiments['specs.ShouldForceCaptchaVerificationOnLoginSpec'] === 'Enabled'
				const visibleCaptchaIsOn = shouldForceCaptchaVerificationFT || captchaSettings.visible.login
				const [passwordConnections, idps] = partition(await api.getConnections(), {
					appDefId: KNOWN_CONNECTION_APPEFIDS.PASSWORD,
				})
				const headlessRedirectUrl = await api.getLoginUrl()

				const props = {
					bsi,
					displayMode,
					language: language.userLanguage,
					directionByLanguage: language.directionByLanguage,
					isCloseable,
					smCollectionId: smcollectionId,
					svSession,
					biVisitorId: getBiVisitorId(),
					metaSiteId,
					isEmailLoginEnabled: passwordConnections.length > 0,
					idps,
					shouldForceCaptchaVerification: !captchaSettings.invisible.login && visibleCaptchaIsOn,
					isSocialAuthSupported,
					serverError,
					reportBi: businessLogger.reportBi,
					translations,
					externalBaseUrl: api.getExternalBaseUrl(),
					headlessRedirectUrl,
				}
				const actions = {
					onCloseDialogCallback() {
						navigateBackToAuthorization(requestUrl, browserWindow)
						dialogService.hideDialog()
						biEvents.closingDialog('MemberLoginDialog', displayMode)
						smPopups.rejectAuthenticationRequest()
					},
					submit(email: string, password: string, submitOptions?: ILoginOptions) {
						logger.interactionStarted(INTERACTIONS.DEFAULT_LOGIN)
						biEvents.emailAuthSubmitClicked('MemberLoginDialog', displayMode as string)

						return api
							.login(email, password, submitOptions, returnPages, undefined, true)
							.then((loginResult) => {
								logger.interactionEnded(INTERACTIONS.DEFAULT_LOGIN)
								dialogService.hideDialog()
								resolve(loginResult)
							})
							.catch((error) => {
								if (isLoginAcceptableError(error)) {
									logger.interactionEnded(INTERACTIONS.DEFAULT_LOGIN)
								}

								throw error
							})
					},
					onForgetYourPasswordClick() {
						api.promptForgotPassword(isCloseable)
					},
					onSwitchDialogLinkClick() {
						api.showSignUpDialog({ isCloseable, displayMode, returnPages }).then(resolve, () => {
							smPopups.rejectAuthenticationRequest()
						})
					},
					onBackendSocialLogin(data: IAMPlatformLoginResponse, vendor: string) {
						return api.handleSocialLoginResponse(data, vendor, returnPages).then((loginResult) => {
							dialogService.hideDialog()
							resolve(loginResult)
						})
					},
					// Will be called by the component after mounting the social auth iframe to determine what to send inside via postMessage
					getHostReadyPayload: () => ({ visitorId: getBiVisitorId(), svSession }),
					openCaptcha: getOpenCaptcha({ captcha, userLanguage: language.userLanguage }),
					reportSocialAuthStarted,
				}
				biEvents.loginOrSignUpDialogLoaded('MemberLoginDialog', displayMode)
				await dialogService.displayDialog('MemberLoginDialog', props, actions, getDialogOptions())
				api.closeCustomAuthenticationDialogs(true)
			})
		},
		async showSignUpDialog(options: IShowAuthPageOptions = {}, serverError?: any): Promise<ExtendedLoginResult> {
			const { returnPages, isCloseable, displayMode } = {
				isCloseable: true,
				displayMode: 'fullscreen' as IShowAuthPageOptions['displayMode'],
				returnPages: false,
				...options,
			}
			const captchaSettings = await siteMembersSettingsService.getCaptchaSettings()
			googleSdk.setCaptchaBadgeVisibility(captchaSettings.invisible.signup)
			if (customSignUpPageId && popups?.isLightbox(customSignUpPageId)) {
				return api.showCustomAuthenticationDialog(customSignUpPageId, returnPages)
			}
			const shouldForceCaptchaVerificationFTs =
				experiments['specs.ShouldPassCaptchaVerificationOnSignupSpec'] !== 'Enabled' &&
				experiments['specs.ShouldForceCaptchaVerificationOnSignupSpec'] === 'Enabled'

			return new Promise(async (resolve, reject) => {
				const visibleCaptchaIsOn =
					shouldForceCaptchaVerificationFTs ||
					(captchaSettings.visible.signup &&
						experiments['specs.ShouldPassCaptchaVerificationOnSignupSpec'] !== 'Enabled')
				const [passwordConnections, idps] = partition(await api.getConnections(), {
					appDefId: KNOWN_CONNECTION_APPEFIDS.PASSWORD,
				})
				const headlessRedirectUrl = await api.getLoginUrl()

				smPopups.assignRequestAuthenticationPromise(resolve, reject)

				const props = {
					bsi,
					displayMode,
					language: language.userLanguage,
					directionByLanguage: language.directionByLanguage,
					isCloseable,
					smCollectionId: smcollectionId,
					biVisitorId: getBiVisitorId(),
					svSession,
					metaSiteId,
					isSocialAuthSupported,
					isEmailLoginEnabled: passwordConnections.length > 0,
					idps,
					isCommunityInstalled: await communityService.canHavePublicCommunity(),
					privacyNoteType,
					joinCommunityCheckedByDefault,
					isTermsOfUseNeeded: !!(termsOfUse?.enabled && policyLinks.termsOfUse),
					isPrivacyPolicyNeeded: !!(privacyPolicy?.enabled && policyLinks.privacyPolicy),
					isCodeOfConductNeeded: !!(codeOfConduct?.enabled && policyLinks.codeOfConduct),
					shouldForceCaptchaVerification: !captchaSettings.invisible.signup && visibleCaptchaIsOn,
					termsOfUseLink: policyLinks.termsOfUse,
					privacyPolicyLink: policyLinks.privacyPolicy,
					codeOfConductLink: policyLinks.codeOfConduct,
					serverError,
					reportBi: businessLogger.reportBi,
					translations,
					externalBaseUrl: api.getExternalBaseUrl(),
					headlessRedirectUrl,
				}
				const actions = {
					onCloseDialogCallback() {
						navigateBackToAuthorization(requestUrl, browserWindow)
						dialogService.hideDialog()
						biEvents.closingDialog('SignUpDialog', displayMode)
						smPopups.rejectAuthenticationRequest()
					},
					async submit(email: string, password: string, submitOptions: ISignUpOptions | boolean) {
						// TODO: Since editor-elements will be GAing after the TB version we need to continue supporting
						// the 3rd attribute as `isCommunityChecked`, once we done we should remove it.
						let profilePrivacyStatus
						if (await communityService.canHavePublicCommunity()) {
							const isCommunityChecked =
								typeof submitOptions === 'boolean' ? submitOptions : submitOptions.isCommunityChecked
							profilePrivacyStatus = isCommunityChecked ? PrivacyStatus.PUBLIC : PrivacyStatus.PRIVATE
						}
						const recaptchaToken =
							typeof submitOptions === 'boolean' ? undefined : submitOptions?.recaptchaToken
						logger.interactionStarted(INTERACTIONS.DEFAULT_SIGNUP)
						biEvents.emailAuthSubmitClicked('SignUpDialog', displayMode as string)
						return api
							.register(
								email,
								password,
								undefined,
								profilePrivacyStatus,
								true,
								returnPages,
								recaptchaToken,
								undefined
							)
							.then((registerResult) => {
								logger.interactionEnded(INTERACTIONS.DEFAULT_SIGNUP)
								const { member, sessionToken, pages } = registerResult
								if (sessionToken) {
									dialogService.hideDialog(true)
									resolve({ member, sessionToken, ...(returnPages ? { pages } : {}) })
								}
							})
							.catch((error) => {
								if (isSignupAcceptableError(error)) {
									logger.interactionEnded(INTERACTIONS.DEFAULT_SIGNUP)
								}

								throw error
							})
					},
					onSwitchDialogLinkClick() {
						api.showLoginDialog({ isCloseable, displayMode, returnPages }).then(resolve, () => {
							smPopups.rejectAuthenticationRequest()
						})
					},
					onBackendSocialLogin(data: IAMPlatformLoginResponse, vendor: string) {
						return api.handleSocialLoginResponse(data, vendor, returnPages).then((loginResult) => {
							dialogService.hideDialog()
							resolve(loginResult)
						})
					},
					// Will be called by the component after mounting the social auth iframe to determine what to send inside via postMessage
					getHostReadyPayload: () => ({ visitorId: getBiVisitorId(), svSession }),
					openCaptcha: getOpenCaptcha({ captcha, userLanguage: language.userLanguage }),
					reportSocialAuthStarted,
				}
				biEvents.loginOrSignUpDialogLoaded('SignUpDialog', displayMode)
				await dialogService.displayDialog('SignUpDialog', props, actions, getDialogOptions())
				api.closeCustomAuthenticationDialogs(true)
			})
		},
		async hideAuthDialog() {
			// This function is supported only for document service to allow hiding the dialog by the editor
			console.warn('hideAuthDialog is not supported')
		},
		async showNotificationDialog(
			title: string,
			description: string,
			okButtonText: string,
			onOkButtonClick: () => void = () => 0,
			onCloseDialogCallback: () => void = () => 0
		) {
			const props = {
				isCloseable: true,
				title,
				description,
				okButtonText,
				translations,
			}
			const actions = {
				onCloseDialogCallback() {
					navigateBackToAuthorization(requestUrl, browserWindow)
					biEvents.closingDialog('NotificationDialog')
					dialogService.hideDialog()
					onCloseDialogCallback()
				},
				onOkButtonClick() {
					dialogService.hideDialog()
					onOkButtonClick()
				},
			}

			await dialogService.displayDialog('NotificationDialog', props, actions)
		},
		async showConfirmationEmailDialog(memberId: string, isSignUp = true) {
			return new Promise((_, reject) => {
				const props = {
					isCloseable: true,
					isSignUp,
					translations,
				}
				const actions = {
					onCloseDialogCallback() {
						navigateBackToAuthorization(requestUrl, browserWindow)
						biEvents.closingDialog('ConfirmationEmailDialog')
						dialogService.hideDialog()
						// We must reject both, since we might get here by promptLogin() or by simply register()
						smPopups.rejectAuthenticationRequest()
						reject(AUTH_RESULT_REASON.CANCELED)
					},
					async onResendConfirmationEmail() {
						await api.resendEmailVerification(memberId)
						await api.showConfirmationEmailDialog(memberId, false).catch(reject)
					},
				}

				dialogService.displayDialog('ConfirmationEmailDialog', props, actions)
			})
		},
		async showAdminApprovalDialog(email: string) {
			return new Promise((_, reject) => {
				const cancel = () => {
					navigateToAuthorization(browserWindow, requestUrl, { error: SSO_ERRORS.ACCESS_DENIED })
					// We must reject both, since we might get here by promptLogin() or by simply register()
					smPopups.rejectAuthenticationRequest()
					reject(AUTH_RESULT_REASON.CANCELED)
				}
				api.showNotificationDialog(
					'',
					`${translations.applySuccess1} ${translations.applySuccess2}`.replace('{0}', email),
					translations.containerOk,
					cancel,
					cancel
				)
			})
		},
		async showCustomAuthenticationDialog(
			pageId: string,
			returnPages: boolean = false
		): Promise<ExtendedLoginResult> {
			if (!popups) {
				throw new Error('popup unavailable')
			}

			return new Promise(async (resolve, reject) => {
				// In order to reject/resolve the original request for authentication we save the
				// rejection to a file scoped variable.
				smPopups.assignRequestAuthenticationPromise(resolve, reject)
				const cbid = api.registerToUserLogin(async () => {
					smPopups.resolveAuthenticationRequest({
						member: memberDetails,
						sessionToken: savedSessionToken,
						...(returnPages
							? {
									pages: await api.authorizeMemberPagesBySignedInstance(smToken),
							  }
							: {}),
					})
					api.unRegisterToUserLogin(cbid)
					if (popups.getCurrentLightboxId() === pageId) {
						popups.close()
					}
				}, 'customAuthCbId')
				await smPopups.openPopupPage(pageId, () => {
					api.unRegisterToUserLogin(cbid)
				})
				dialogService.hideDialog()
			})
		},
		async closeCustomAuthenticationDialogs(ignoreCallback = false) {
			const customPopupPageId = popups?.getCurrentLightboxId()
			if (customPopupPageId && [customSignUpPageId, customSignInPageId].includes(customPopupPageId)) {
				if (ignoreCallback) {
					smPopups.preventCustomPopupCloseCallback()
				}
				await popups!.close()
				smPopups.allowCustomPopupCloseCallback()
			}
		},
		getForgotPasswordToken() {
			const url = new URL(isSSR(browserWindow) ? requestUrl : browserWindow.location.href)
			return url.searchParams.get('forgotPasswordToken')
		},
		shouldDisplayWelcomeDialog() {
			return sm_efCookie && isMemberInfoPage
		},
		async showVerificationCodeDialog(
			verificationCodeProps: VerificationCodeProps,
			shouldKeepPrevDialog: boolean = true
		): Promise<string | null> {
			const displayMode: CommonProps['displayMode'] = 'customPopup'
			return new Promise(async (resolve, reject) => {
				logger.interactionStarted(INTERACTIONS.VERIFICATION_CODE)
				biEvents.siteMembersEmailConfirmationNewMembersModalLoad()
				smPopups.assignRequestAuthenticationPromise(resolve, reject)
				const props = {
					language: language.userLanguage,
					directionByLanguage: language.directionByLanguage,
					isCloseable: smPopups.config?.isCloseable ?? true,
					displayMode,
					email: verificationCodeProps?.email,
					error: verificationCodeProps?.error,
					translations,
					isAuthV2Enabled: true,
				}
				const actions = {
					async onResendVerificationCodeEmail() {
						biEvents.siteMembersEmailConfirmationOnResendCodeClick()
						// Send new verification code
						await performFetch(`${stateMachineServiceUrl}/v1/proceed`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								authorization: metasiteInstance || '',
							},
							body: JSON.stringify({
								stateToken: verificationCodeProps.stateToken,
							}),
						})
					},
					onCloseDialogCallback() {
						biEvents.closingDialog('VerificationCode')
						navigateBackToAuthorization(requestUrl, browserWindow)
						dialogService.hideDialog()
						smPopups.rejectAuthenticationRequest()
						reject(AUTH_RESULT_REASON.CANCELED)
					},
					onSubmitCallback(code: string) {
						biEvents.siteMembersEmailConfirmationSendCodeClick()
						resolve(code)
					},
				}
				logger.interactionEnded(INTERACTIONS.VERIFICATION_CODE)
				dialogService.displayDialog('VerificationCodeDialog', props, actions, undefined, shouldKeepPrevDialog)
			})
		},
		async appWillMount() {
			if (loginSocialBarOnSite) {
				await api.getMemberDetails()
			}
			const url = new URL(viewerModel.requestUrl)
			// Enable forcing dialogs for testing and debugging purposes
			switch (url.searchParams.get('showDialog')) {
				case 'MemberLoginDialog':
					api.showLoginDialog()
					break
				case 'SignUpDialog':
					api.showSignUpDialog()
					break
				case 'RequestPasswordResetDialog':
					api.promptForgotPassword()
					break
				case 'ResetPasswordDialog':
					api.showResetPasswordDialog('faketoken')
					break
				case 'LoggedInResetPasswordDialog':
					api.showLoggedInResetPasswordDialog()
					break
				case 'WelcomeDialog':
					api.showWelcomeDialog()
					break
				case 'NoPermissionsToPageDialog':
					api.showNoPermissionsToPageDialog()
					break
				case 'NotificationDialog':
					api.showNotificationDialog('title', 'description', 'ok')
					break
				case 'ConfirmationEmailDialog':
					api.showConfirmationEmailDialog('fakemember')
					break
				case 'VerificationCodeDialog':
					api.showVerificationCodeDialog({
						email: 'testEmail@test.com',
					})
					break
				default:
					break
			}
		},
		pageWillUnmount({ pageId }: { pageId: string }) {
			// We usually hide our dialogs on navigation. This lets us get out of the way in case
			// the visitor backs out of a protected page, navigates from the sign up dialog
			// to one of the policy pages, etc.
			// However, if we're using any custom forms, we mustn't treat their closure as a navigation
			// event, even though TB lifecycle does. This may lead to dialogs we intentionally opened
			// (eg. email approval dialog at the end of registration) being unintentionally closed.
			if (![customSignUpPageId, customSignInPageId].includes(pageId)) {
				dialogService.hideDialog()
			}
		},
		getSocialAuthComponentProps(): SocialAuthComponentProps {
			return _getSocialAuthComponentProps({
				config: siteFeatureConfig,
				viewerModel,
				sessionManager,
				bsiManager,
				handleSocialLoginResponse: api.handleSocialLoginResponse,
				isSocialAuthSupported: isCustomLoginSocialAuthSupported,
				captcha,
				userLanguage: language.userLanguage,
				reportBi: businessLogger.reportBi,
				reportSocialAuthStarted,
				useNewSocialFlow: true,
				translations,
			})
		},
		async getConnections() {
			// In the future we may want to override the enabled connections with settings set on the document,
			// in order to enable more fine grained control over what we display as opposed to what's generally
			// available. Right now this feature isn't ready.
			const overrides = {
				[KNOWN_CONNECTION_APPEFIDS.FACEBOOK]: true, // socialLoginFacebookEnabled,
				[KNOWN_CONNECTION_APPEFIDS.GOOGLE]: true, // socialLoginGoogleEnabled,
				[KNOWN_CONNECTION_APPEFIDS.APPLE]: false, // We don't support apple login on the web yet
			}

			return siteMembersSettingsService.getEnabledConnections(overrides).then((connections) =>
				connections.map(({ id, appDefId, displayName }) => ({
					id,
					appDefId,
					name: displayName,
				}))
			)
		},
		getLoginUrl() {
			if (clientId && experiments['specs.thunderbolt.shouldFetchLoginUrlByClientId']) {
				return siteMembersSettingsService.getLoginRedirectUrl()
			}
		},
		getExternalBaseUrl() {
			return experiments['specs.thunderbolt.shouldUseExternalBaseUrl'] ? externalBaseUrl : undefined
		},
		async register(
			email: string,
			password: string,
			contactInfo?: IContactInfo,
			profilePrivacyStatus?: PrivacyStatus,
			isDefaultFlow?: boolean,
			returnPages?: boolean,
			recaptchaToken?: string,
			emailVerification?: IEmailVerification
		): Promise<ExtendedRegisterResult> {
			returnPages = returnPages ?? false
			try {
				const captchaSettings = await siteMembersSettingsService.getCaptchaSettings()
				// We wish to prevent calls to the server since we already know the captcha is required
				if (
					captchaSettings.visible.signup &&
					experiments['specs.ShouldPassCaptchaVerificationOnSignupSpec'] !== 'Enabled' &&
					!recaptchaToken &&
					!emailVerification?.otp &&
					!emailVerification?.verificationId
				) {
					throw CAPTCHA_REQUIRED_RESPONSE
				}
				logger.interactionStarted(INTERACTIONS.CODE_SIGNUP)
				reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.SIGNUP.SUBMIT))
				const currentPopupId = popups?.getCurrentLightboxId()
				const currentPageId = currentRouteInfo.getCurrentRouteInfo()?.pageId
				// Legally, in order to use invisible captcha we need terms of use to be shown, the terms
				// are shown only when the login/signup pages are open
				const isRequestIncomingFromSignupPage =
					isDefaultFlow ||
					(customSignUpPageId && currentPopupId && customSignUpPageId === currentPopupId) ||
					(customSignUpPageId && currentPageId && customSignUpPageId === currentPageId)
				const invisibleRecaptchaToken: string | undefined =
					captchaSettings.invisible.signup && isRequestIncomingFromSignupPage
						? await getInvisibleCaptchaToken(AUTH_METHODS.SIGNUP)
						: undefined

				const body = {
					profile: {
						...serializeIdentityProfile(contactInfo || {}),
						privacyStatus: profilePrivacyStatus,
						emails: [email],
					},
					loginId: { email },
					password,
					captchaTokens: [
						...(recaptchaToken
							? [
									{
										Recaptcha: recaptchaToken,
									},
							  ]
							: []),
						...(invisibleRecaptchaToken
							? [
									{
										InvisibleRecaptcha: invisibleRecaptchaToken,
									},
							  ]
							: []),
					],
				} as RegisterV2Request
				const result = await httpClient
					.request(registerV2(body), { signedInstance: metasiteInstance || '' })
					.then((res: { data: StateMachineResponse }) => res.data)
					.catch((error) => {
						throw error.response?.data ?? error
					})

				logger.interactionEnded(INTERACTIONS.CODE_SIGNUP)
				const stateMachine = await api.getStateMachine(result, email)
				const protectedPages = stateMachine?.additionalData?.protectedPages as any
				const pagesFromIAM = toAuthorizedPages(protectedPages)
				const memberData = memberDetailsFromIAMResponseV2(stateMachine)

				const redirected = navigateToAuthorization(browserWindow, requestUrl, {
					sessionToken: stateMachine?.sessionToken!,
				})
				if (redirected && experiments['specs.thunderbolt.useNewPostLoginRedirect']) {
					return hangingPromise()
				}

				const pages = await api.applySessionToken(
					stateMachine?.sessionToken!,
					memberData,
					returnPages && !pagesFromIAM,
					true
				)
				const resolvedPages = pagesFromIAM ?? pages

				reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.SIGNUP.SUCCESS))
				reporter.trackEvent({
					eventName: 'CompleteRegistration',
					params: {
						origin: 'Site members',
						method: 'Wix',
					},
				})
				const sessionToken = stateMachine?.sessionToken!
				return {
					member: memberData,
					status: memberData.status,
					sessionToken,
					...(returnPages && resolvedPages ? { pages: resolvedPages } : {}),
				}
			} catch (error) {
				if (isSignupAcceptableError(error)) {
					logger.interactionEnded(INTERACTIONS.CODE_SIGNUP)
				} else {
					reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.SIGNUP.FAIL))
				}

				throw error
			}
		},
		async getStateMachine(response: StateMachineResponse, email: string): Promise<StateMachineResponse> {
			const memberState = response?.state
			// In case member need to wait for admin approval
			if (memberState === StateType.REQUIRE_OWNER_APPROVAL) {
				return api.showAdminApprovalDialog(email) as Promise<ExtendedLoginResult>
			}
			// In case member need to wait for email verification
			if (memberState === StateType.REQUIRE_EMAIL_VERIFICATION) {
				return api.verifyEmail(email, response?.stateToken!).then((verifyResult: StateMachineResponse) => {
					dialogService.hideDialog()
					return api.getStateMachine(verifyResult, email)
				})
			}
			return response
		},
		async verifyEmail(
			email: string,
			stateToken: string,
			retry?: boolean,
			errorCode?: string,
			otpCode?: string
		): Promise<StateMachineResponse> {
			try {
				const otp =
					otpCode ?? (await api.showVerificationCodeDialog({ email, stateToken, error: errorCode }, !retry))
				const payload = {
					stateToken: stateToken || '',
					code: otp as string,
				}

				const response = await httpClient.request(verifyDuringAuthentication(payload), {
					signedInstance: metasiteInstance || '',
				})

				return response.data
			} catch (error) {
				if (error === AUTH_RESULT_REASON.CANCELED) {
					throw error
				}
				const _errorCode = error?.details?.applicationError?.code ?? 'BAD_CODE'
				// Recursive call to retry the verification
				return api.verifyEmail(email, stateToken, true, _errorCode)
			}
		},
		async login(
			email: string,
			password: string,
			options?: ILoginOptions,
			returnPages: boolean = false,
			emailVerification?: IEmailVerification,
			isDefaultFlow: boolean = false
		): Promise<ExtendedLoginResult> {
			try {
				const captchaSettings = await siteMembersSettingsService.getCaptchaSettings()
				// We wish to prevent calls to the server since we already know the captcha is required
				if (
					captchaSettings.visible.login &&
					!options?.recaptchaToken &&
					!emailVerification?.otp &&
					!emailVerification?.verificationId
				) {
					throw CAPTCHA_REQUIRED_RESPONSE
				}
				reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.LOGIN.SUBMIT))

				const currentPopupId = popups?.getCurrentLightboxId()
				const currentPageId = currentRouteInfo.getCurrentRouteInfo()?.pageId
				const isRequestIncomingFromLoginPage =
					isDefaultFlow ||
					(customSignInPageId && currentPopupId && customSignInPageId === currentPopupId) ||
					(customSignInPageId && currentPageId && customSignInPageId === currentPageId)
				const invisibleRecaptchaToken =
					captchaSettings.invisible.login && isRequestIncomingFromLoginPage
						? await getInvisibleCaptchaToken(AUTH_METHODS.LOGIN)
						: undefined
				const captchaTokens: Array<CaptchaToken> = []
				if (options?.recaptchaToken) {
					captchaTokens.push({
						Recaptcha: options?.recaptchaToken,
					})
				}
				if (invisibleRecaptchaToken) {
					captchaTokens.push({
						InvisibleRecaptcha: invisibleRecaptchaToken,
					})
				}
				const loginRequest = {
					loginId: { email },
					password,
					captchaTokens,
				} as LoginV2Request
				const result = await httpClient
					.request(loginV2(loginRequest), {
						signedInstance: metasiteInstance || '',
					})
					.then((res) => res.data as StateMachineResponse)
					.catch((error) => {
						throw error.response?.data ?? error
					})

				const stateMachine = await api.getStateMachine(result, email)
				const protectedPages = stateMachine?.additionalData?.protectedPages as any
				const pagesFromIAM = toAuthorizedPages(protectedPages)
				const memberData = memberDetailsFromIAMResponseV2(stateMachine)

				const redirected = navigateToAuthorization(browserWindow, requestUrl, {
					sessionToken: stateMachine?.sessionToken!,
				})
				if (redirected && experiments['specs.thunderbolt.useNewPostLoginRedirect']) {
					return hangingPromise()
				}

				const returnedPages = (await api.applySessionToken(
					stateMachine?.sessionToken!,
					memberData,
					returnPages && !pagesFromIAM,
					true
				)) as AuthorizedPages
				const resolvedPages = pagesFromIAM ?? returnedPages
				// TODO: I'm not sure it's right, I think `INTERACTIONS.DEFAULT_SIGNUP reach here as well.
				const sessionToken = stateMachine?.sessionToken!
				return {
					sessionToken,
					member: memberData!,
					...(returnPages ? { pages: resolvedPages } : {}),
				}
			} catch (error) {
				if (!isLoginAcceptableError(error)) {
					reporter.trackEvent({
						eventName: 'CustomEvent',
						params: {
							eventCategory: 'Site members',
							eventAction: 'Log in Failure',
							eventLabel: 'Wix',
						},
					})
				}
				if (error?.details?.applicationError?.code === ERROR_CODES.WAITING_APPROVAL) {
					api.showAdminApprovalDialog(email)
				}
				throw error?.response?.data ?? error
			}
		},
	}

	siteMembersExports.export({
		promptLogin: api.promptLogin,
		logout: api.logout,
		memberDetails,
	})

	featureState.update(() => ({
		shouldShowRenderingBlockingDialogs: () => !!(api.getForgotPasswordToken() || api.shouldDisplayWelcomeDialog()),
		showRenderingBlockingDialogs: () => {
			const forgotPasswordToken = api.getForgotPasswordToken()

			// TODO: take care of the all the dialogs and behaviours that are triggered by
			// url, cookies, etc.
			if (forgotPasswordToken) {
				return api.showResetPasswordDialog(forgotPasswordToken)
			}
			if (api.shouldDisplayWelcomeDialog()) {
				return api.showWelcomeDialog()
			}
		},
	}))
	// TS incorrectly infers that the `applySessionToken` implementation above (which supports
	// an optional return type if an undocumented argument is applied) is incompatible with the
	// declared type.
	// This omit+union operation forces TS to accept `applySessionToken` as correct while still
	// typechecking the rest of the object.
	return api as Omit<typeof api, 'applySessionToken'> & { applySessionToken: ISiteMembersApi['applySessionToken'] }
}

const clearCookie = (cookieName: string, path: string, domain: string) => {
	document.cookie = `${cookieName}=;max-age=0`
	document.cookie = `${cookieName}=;max-age=0;path=${path}`
	document.cookie = `${cookieName}=;domain=${domain};max-age=0`
	document.cookie = `${cookieName}=;domain=${domain};max-age=0;path=${path}`
}

export const SiteMembersApi = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		named(MasterPageFeatureConfigSymbol, name),
		named(FeatureStateSymbol, name),
		named(FeatureExportsSymbol, name),
		Fetch,
		LoggerSymbol,
		ViewerModelSym,
		SessionManagerSymbol,
		Props,
		StructureAPI,
		LanguageSymbol,
		BrowserWindowSymbol,
		Router,
		optional(SiteScrollBlockerSymbol),
		UrlHistoryManagerSymbol,
		BusinessLoggerSymbol,
		WixBiSessionSymbol,
		optional(LightboxSymbol),
		optional(ReporterSymbol),
		CurrentRouteInfoSymbol,
		ExperimentsSymbol,
		optional(CaptchaApiSymbol),
		optional(CyclicTabbingSymbol),
		optional(BsiManagerSymbol),
	],
	siteMembersApi
)
