import type { TRANSLATIONS, TRANSLATION_KEYS } from './constants'
import type { MasterPageDefinition } from '@wix/thunderbolt-components'
import type { PageLinkData, Language } from '@wix/thunderbolt-becky-types'
import type { ICaptchaApi } from '@wix/thunderbolt-commons'
import type {
	ViewerModel,
	IStatus,
	MemberDetails,
	CallbackId,
	LoginOptions,
	LoginResult,
} from '@wix/thunderbolt-symbols'
import type { ISessionManager } from 'feature-session-manager'
import type { BusinessLogger, IBsiManager } from 'feature-business-logger'
import type { CommonProps, VerificationCodeProps } from './dialogService'
import { CAPTCHA_SETTINGS_OPTIONS } from './utils'
import {
	StatusV2,
	PrivacyStatus,
	StatusName,
	LoginResponse,
} from '@wix/ambassador-iam-authentication-v1-authentication/types'

export { IStatus, MemberDetails, LoginOptions, LoginResult }

export type DialogOptions = {
	registerToAppDidMount?: (cb: () => void) => void
	shouldWaitForAppDidMount?: boolean
}

export type MemberDetailsDTO = {
	admin: boolean
	attributes: {
		connectToUserDate?: string
		emailVerified: boolean
		firstName?: string
		imageUrl?: string
		lastName?: string
		name?: string
		nickname: string
		privacyStatus: string
	}
	collectionId: string
	contactId: string
	dateCreated: string
	dateUpdated: string
	email: string
	id: string
	memberRole: string
	name?: string
	owner: boolean
	slug: string
	status: IStatus
}

export type Identity = {
	id: string
	identityProfile: IdentityProfile
	status: StatusV2
	identifiers: Array<{ email: string }>
	createdDate: string
	updatedDate: string
	email?: {
		address: string
		isVerified: boolean
	}
	revision: string
}

export type IdentityProfile = {
	firstName: string
	lastName: string
	nickname: string
	imageUrl: string
	privacyStatus: string
	customFields: Array<{
		name: string
		value: CustomValue
	}>
}

type CustomValue =
	| {
			strValue: string
	  }
	| {
			numValue: number
	  }
	| {
			dateValue: string
	  }
	| {
			listValue: {
				value: Array<CustomValue>
			}
	  }
	| {
			mapValue: {
				value: {
					[key: string]: CustomValue
				}
			}
	  }

export type AdditionalData = {
	[key: string]: CustomValue
}

export type IAMPlatformLoginResponse = LoginResponse

export type AuthenticationToken = string

export type RegisterResult = {
	sessionToken?: string
	member: MemberDetails
	status: IStatus
	approvalToken?: string
}

/**
 * Used for the BI events
 */
export type ViewModeProp = 'DESKTOP' | 'MOBILE'

export type AuthenticationResult = { success: boolean; token?: AuthenticationToken; reason: string }

export type AuthorizedPages = { [pageId: string]: string }
export type RequestAuthorizedPagesResult =
	| { success: true; pages: AuthorizedPages }
	| { success: false; reason: string }

export interface ISiteMembersApi {
	login(email: string, password: string, options?: ILoginOptions): Promise<LoginResult>
	promptLogin(loginOptions?: Partial<LoginOptions>): Promise<LoginResult>
	promptForgotPassword(): Promise<void>
	/**
	 * @deprecated Replaced by requestAuthorizedPages, can be removed when specs.thunderbolt.newAuthorizedPagesFlow is merged
	 * @param loginOptions
	 * @returns the token of the logged in user, if needed opens login dialog
	 * and resolves after the user is logged in. if user cancelled or there was a failure returns success: false with a reason
	 */
	requestAuthentication(loginOptions?: Partial<LoginOptions>): Promise<AuthenticationResult>
	/**
	 * Attempts to return the member's authorized pages.
	 *
	 * If a visitor is not logged in, logs them in (according the the optional login dialog options)
	 * and return their authorized pages.
	 *
	 * If a member is already logged in, return a version of their authorized pages at least as
	 * recent as their login.
	 *
	 * **Important:** There is no guarantee that this method will return correct results if a
	 * member gained access to additional authorized pages since they logged in (eg. by
	 * subscribing to a paid plan). In this case use `authorizeMemberPagesBySignedInstance` directly.
	 * @param loginOptions Login dialog options
	 */
	requestAuthorizedPages(loginOptions?: Partial<LoginOptions>): Promise<RequestAuthorizedPagesResult>
	applySessionToken(token: string): Promise<void>
	/**
	 * @deprecated Replaced by authorizeMemberPagesBySignedInstance, can be removed when specs.thunderbolt.newAuthorizedPagesFlow is merged
	 */
	authorizeMemberPagesByToken(token: string): Promise<AuthorizedPages>
	/**
	 * @deprecated Replaced by authorizeMemberPagesBySignedInstance, can be removed when specs.thunderbolt.newAuthorizedPagesFlow is merged
	 */
	authorizeMemberPagesByCookie(): Promise<AuthorizedPages>
	authorizeMemberPagesBySignedInstance(instance: string): Promise<AuthorizedPages>
	getMemberDetails(refreshCurrentMember?: boolean): Promise<MemberDetails | null>
	register(
		email: string,
		password: string,
		contactInfo?: IContactInfo,
		profilePrivacyStatus?: PrivacyStatus,
		defaultFlow?: boolean,
		returnPages?: boolean,
		recaptchaToken?: string | null
	): Promise<RegisterResult>
	sendSetPasswordEmail(email: string, options?: { hideIgnoreMessage?: boolean }): Promise<boolean>
	sendForgotPasswordMail(email: string): Promise<void>
	changePassword(newPassword: string, token: string): Promise<void>
	registerToUserLogin(callback: (user: MemberDetails) => any): CallbackId
	unRegisterToUserLogin(callbackId: CallbackId): void
	registerToMemberLogout(callback: () => any): CallbackId
	unRegisterToMemberLogout(callbackId: CallbackId): void
	registerToMemberDetailsRefresh(callback: (user: MemberDetails) => any): CallbackId
	unRegisterToMemberDetailsRefresh(callbackId: CallbackId): void
	logout(redirectToUrl?: string): Promise<void>
	handleSocialLoginResponse(payload: IAMPlatformLoginResponse, vendor: string): Promise<LoginResult>
	getSocialAuthComponentProps(): SocialAuthComponentProps
	showNoPermissionsToPageDialog(onCloseCallback?: () => any): Promise<void>
	showResetPasswordDialog(token: string): void
	showWelcomeDialog(): void
	closeCustomAuthenticationDialogs(ignoreCallback?: boolean): Promise<void>
	showConfirmationEmailDialog(memberId: string, isSignUp: boolean): Promise<unknown>
	showVerificationCodeDialog(verificationCodeProps: VerificationCodeProps): Promise<unknown>
	showAdminApprovalDialog(email: string, type: 'signup' | 'login'): Promise<unknown>
	showLoginDialog(): Promise<LoginResult | void>
	showSignUpDialog(): Promise<LoginResult | void>
	hideAuthDialog(): Promise<void>
}

export type SiteMembersState = {
	shouldShowRenderingBlockingDialogs: () => boolean
	showRenderingBlockingDialogs: () => void
}

export type ILink = { href: string; target: PageLinkData['target'] }
type ICaptchaPages = { login: boolean; signup: boolean }
export type ICaptchaSettings = { invisible: ICaptchaPages; visible: ICaptchaPages }
/**
 * Site feature config is calculated in SSR when creating the `viewerModel`
 * The config is available to your feature by injecting `named(SiteFeatureConfigSymbol, name)`
 */

export type SiteMembersSiteConfig = {
	collectionExposure: string
	smcollectionId: string
	smToken: string
	sm_efCookie: string
	smSessionCookie: string
	protectedHomepage: boolean
	isCommunityInstalled: boolean
	isTemplate: boolean
	loginSocialBarOnSite: boolean
	membersInfoAppDefId?: string
	memberInfoAppId?: number | undefined
}

export type SiteMembersPageConfig = {
	componentIds: Array<string>
}

export type SiteMembersMasterPageConfig = {
	smSettings: MasterPageDefinition['data']['smSettings']
	translations: { [key in keyof typeof TRANSLATIONS]: string }
	policyLinks: {
		codeOfConduct?: ILink
		privacyPolicy?: ILink
		termsOfUse?: ILink
	}
	tpaAppDefinitionIds?: {
		[tpaAppDefinitionId: string]: true
	}
	tpaApplicationIds?: {
		[tpaApplicationId: number]: true
	}
}

export type IGetSocialAuthComponentProps = (props: GetSocialAuthComponentsPropsProps) => SocialAuthComponentProps
export type SocialAuthComponentProps = {
	bsi: string
	biVisitorId: string
	smCollectionId: string
	svSession: string
	metaSiteId: string
	isSocialAuthSupported: boolean
	onBackendSocialLogin?: (payload: IAMPlatformLoginResponse, vendor: string) => Promise<LoginResult>
	getHostReadyPayload: () => { visitorId: string; svSession: string; bsi: string }
	openCaptcha(): Promise<string>
	reportBi: BusinessLogger['reportBi']
	reportSocialAuthStarted: (vendor: string) => void
	useNewSocialFlow: boolean
	translations: Record<TRANSLATION_KEYS, string | undefined>
}

export type IContactInfo = {
	firstName?: string
	lastName?: string
	picture?: string
	emails?: Array<string>
	loginEmail?: string
	phones?: Array<string>
	labels?: Array<string>
	language?: string
	customFields: Array<any>
}

export type CurrentMemberTPAHandlerResponse = {
	attributes?: {
		firstName: string
		lastName: string
		privacyStatus: string
	}
	name?: string
	email?: string
	id: string
	owner: boolean
	status: string
} | null

export type TPARequestLoginOptions = {
	mode?: 'signup' | 'login'
	modal?: boolean
	language?: string
}

export type TPALogoutOptions = {
	url?: string
}

export interface ILoginOptions {
	recaptchaToken?: string | null
}

export interface ISignUpOptions {
	isCommunityChecked: boolean
	recaptchaToken?: string
	verificationCode?: string
}

/*
	When the user signing up to a site with members approval requirement
	we won't get an smSession but we would get `siteMembersDto` inside our payload
*/
export interface IMemberPayload {
	smSession?: {
		sessionToken: string
		siteMemberDto: MemberDetailsDTO
	}
	siteMemberDto: MemberDetailsDTO
	// Allows us to differentiate between this and IAMPlatformLoginResponse at runtime
	// in a way that works with TS type inference.
	additionalData?: undefined
}

export type GetSocialAuthComponentsPropsProps = {
	config: SiteMembersSiteConfig
	viewerModel: ViewerModel
	sessionManager: ISessionManager
	bsiManager?: IBsiManager
	handleSocialLoginResponse?: ISiteMembersApi['handleSocialLoginResponse']
	isSocialAuthSupported: boolean
	captcha?: ICaptchaApi
	userLanguage: Language
	reportBi: BusinessLogger['reportBi']
	reportSocialAuthStarted: (vendor: string) => void
	useNewSocialFlow: boolean
	translations: Record<TRANSLATION_KEYS, string | undefined>
}

export type IEmailVerification = {
	verificationId: string
	otp: string
}

export type ICaptchaSettingsOption = keyof typeof CAPTCHA_SETTINGS_OPTIONS

export interface ISiteMembersSettings {
	emailVerificationOption: 'NONE' | 'AFTER_SIGNUP' | 'DURING_SIGNUP'
	loginRecaptchaOption: ICaptchaSettingsOption
	signupRecaptchaOption: ICaptchaSettingsOption
	memberAreaEnabled: boolean
	disableSocialLogins: boolean
	name: string
	requireEmailVerification: boolean
	wixBackendLoginOnly: boolean
}

export interface IDPConnection {
	id: string
	appDefId: string
	displayName: string
}

export interface CombinedCollectionSettings {
	collectionSettings: ISiteMembersSettings
	enabledConnections: Array<IDPConnection>
	loginUrl: string
}

export type PrivacyNoteType = 'CHECKBOX' | 'NOTE'

export type IShowAuthPageOptions = Partial<{
	isCloseable: boolean
	displayMode: CommonProps['displayMode']
	returnPages: boolean
}>

export type ISiteMembersSideEffects = {
	onComponentLoaded: (data: { smcollectionId?: string }) => void
}

interface Image {
	id?: string
	url?: string
	height?: number
	width?: number
	offsetX?: number | null
	offsetY?: number | null
}

export enum PrivacyStatusStatus {
	UNKNOWN = 'UNKNOWN',
	PRIVATE = 'PRIVATE',
	PUBLIC = 'PUBLIC',
}

export interface Profile {
	nickname?: string | null
	slug?: string | null
	photo?: Image
	cover?: Image
	title?: string | null
}

export interface Member {
	id?: string | null
	loginEmail?: string | null
	loginEmailVerified?: boolean | null
	status?: Status
	contactId?: string | null
	contact?: Contact
	profile?: Profile
	privacyStatus?: PrivacyStatusStatus
	createdDate?: string
	updatedDate?: string
	lastLoginDate?: string
}

export interface Contact {
	firstName?: string
	lastName?: string
}

export interface ContactInfo {
	name?: {
		/** Contact's first name. */
		first?: string | null
		/** Contact's last name. */
		last?: string | null
	}
}

export interface GetMyMemberResponse {
	/** The requested member. */
	member?: Member
}

export interface GetMemberRoleResponse {
	/**
	 * member's role:
	 *
	 * `OWNER` - member that belongs to site owner
	 * `CONTRIBUTOR` - member that belongs to a contributor in site
	 * `MEMBER` - other members that registered to site
	 */
	role?: Role
	userId?: string | null
	status?: any
	contactId?: string | null
}

export enum Status {
	UNKNOWN = 'UNKNOWN',
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	BLOCKED = 'BLOCKED',
	OFFLINE = 'OFFLINE',
}

export enum Role {
	UNDEFINED_ROLE = 'UNDEFINED_ROLE',
	MEMBER = 'MEMBER',
	OWNER = 'OWNER',
	CONTRIBUTOR = 'CONTRIBUTOR',
}

export interface MemberResult {
	member?: MemberDetails
	sessionToken?: string
	pages?: AuthorizedPages
	status: StatusName
}
