export { PrivacyStatus } from '@wix/ambassador-iam-authentication-v1-authentication/types'

export const AUTH_METHODS = {
	LOGIN: 'login',
	SIGNUP: 'register',
}

export const INTERACTIONS = {
	SOCIAL_APP_LOGIN: 'members-social-app-login',
	SOCIAL_APP_LOGIN_WITH_VENDOR: (vendor: string) => `members-social-app-login-${vendor}`,
	DEFAULT_LOGIN: 'members-default-login',
	CODE_LOGIN: 'members-code-login',
	CODE_SIGNUP: 'members-code-signup',
	DEFAULT_SIGNUP: 'members-default-signup',
	RESET_PASSWORD: 'members-reset-password',
	VERIFY_TOKEN: 'apply-session-token',
	EDITOR: {
		CODE_LOGIN: 'editor-members-code-login',
	},
	WELCOME_DIALOG: 'members-welcome-dialog',
	VERIFICATION_CODE: 'verification-code',
}

export const DIALOGS = {
	Login: 'login',
	SignUp: 'register',
	ResetPasswordEmail: 'resetPasswordEmail',
	ResetPasswordNewPassword: 'resetPasswordNewPassword',
	Notification: 'notification',
	Credits: 'credits',
	PasswordProtected: 'enterPassword',
	EmailVerification: 'emailVerification',
	SentConfirmationEmail: 'sentConfirmationEmail',
	Welcome: 'welcome',
	NoPermissionsToPage: 'noPermissionsToPage',
}

export const NOTIFICATIONS = {
	Template: 'template',
	SiteOwner: 'siteowner',
	SignUp: 'register',
	ResetPasswordEmail: 'resetPasswordEmail',
	ResetPasswordNewPassword: 'resetPasswordNewPassword',
}

export const CompTypes = {
	SocialAuth: 'SocialAuth',
	LoginButton: 'wysiwyg.viewer.components.LoginButton',
	LoginSocialBar: 'wysiwyg.viewer.components.LoginSocialBar',
}

export const AUTH_RESULT_REASON = {
	CANCELED: 'authentication canceled',
	ALREADY_LOGGED_IN: 'already logged in',
	SUCCESS: 'success',
}

export const ERROR_CODES = {
	PASSWORD_RESETED: '-19973',
	WRONG_AUTH_DETAILS: '-19976',
	ACCESS_DENID: '-19956',
	VALIDATION_ERROR: '-19988',
	WAITING_APPROVAL: '-19958',
	UNKNOWN_ACCOUNT: '-19999',
	WRONG_PASSWORD: '-17005',
	EXISTING_EMAIL_ACCOUNT: '-19995',
	CLIENT_AUTH_FORBIDDEN: '-19974',
	EMAIL_NOT_PROVIDED: '-18880',
	CAPTCHA_REQUIRED: '-19971',
	CAPTCHA_INVALID: '-19970',
	RESET_PASSWORD_TOKEN_EXPIRED: '-19972',
	NEW_RESET_PASSWORD_TOKEN_EXPIRED: 'EXPIRED_JWT_TOKEN',
	REQUEST_THROTTLED: '-19959',
	CODE_INVALID: 'EMAIL_VERIFICATION_REQUIRED',
	BAD_CODE: 'EMAIL_VERIFICATION_FAILED',
	SERVER_EXCEPTION: '-19901',
	AUTHENTICATION_FAILED: '-19976',
	UNIMPLEMENTED_FEATURE: 'UNIMPLEMENTED_FEATURE',
}

export const CAPTCHA_ERROR_CODES = [
	ERROR_CODES.CAPTCHA_REQUIRED,
	ERROR_CODES.CAPTCHA_INVALID,
	ERROR_CODES.REQUEST_THROTTLED,
]

export const VERIFICATION_CODE_ERROR_CODES = [ERROR_CODES.CODE_INVALID, ERROR_CODES.BAD_CODE]

export const LOGIN_ERROR_CODES = [
	ERROR_CODES.CLIENT_AUTH_FORBIDDEN,
	ERROR_CODES.PASSWORD_RESETED,
	ERROR_CODES.WRONG_AUTH_DETAILS,
	ERROR_CODES.ACCESS_DENID,
	ERROR_CODES.VALIDATION_ERROR,
	ERROR_CODES.WAITING_APPROVAL,
	ERROR_CODES.UNKNOWN_ACCOUNT,
	ERROR_CODES.WRONG_PASSWORD,
	...CAPTCHA_ERROR_CODES,
	...VERIFICATION_CODE_ERROR_CODES,
]

export const SIGN_UP_ERROR_CODES = [
	ERROR_CODES.CLIENT_AUTH_FORBIDDEN,
	ERROR_CODES.EXISTING_EMAIL_ACCOUNT,
	ERROR_CODES.VALIDATION_ERROR,
	ERROR_CODES.EMAIL_NOT_PROVIDED,
	ERROR_CODES.CODE_INVALID,
	...CAPTCHA_ERROR_CODES,
	...VERIFICATION_CODE_ERROR_CODES,
]

export const UNSUPPORTED_AGENTS_FOR_SOCIAL_AUTH = ['FBAV', 'FBAN', 'Instagram']

export const INVISIBLE_CAPTCHA_API_KEY = '6LdoPaUfAAAAAJphvHoUoOob7mx0KDlXyXlgrx5v'

export const TRACK_EVENTS = {
	CATEGORY: 'Site members',
	LABEL: 'Wix',
	ACTIONS: {
		LOGIN: {
			SUCCESS: 'Log in Success',
			SUBMIT: 'Log in Submit',
			FAIL: 'Log in Failure',
		},
		SIGNUP: {
			SUCCESS: 'Sign up Success',
			SUBMIT: 'Sign up Submit',
			FAIL: 'Sign up Failure',
		},
		LOGOUT: {
			FAIL: 'Log out failed',
		},
		SETTINGS: {
			FAIL: 'Querying site members settings failed',
		},
	},
}

export const getTrackEventParams = (eventAction: string, eventLabel = TRACK_EVENTS.LABEL) => {
	return {
		eventName: 'CustomEvent',
		params: {
			eventCategory: TRACK_EVENTS.CATEGORY,
			eventAction,
			eventLabel,
		},
	}
}

export const CAPTCHA_REQUIRED_RESPONSE = {
	message: `Recaptcha token is required (${ERROR_CODES.CAPTCHA_REQUIRED})`,
	details: {
		applicationError: {
			code: ERROR_CODES.CAPTCHA_REQUIRED,
			description: `Recaptcha token is required (${ERROR_CODES.CAPTCHA_REQUIRED})`,
		},
	},
}

export const newIAMResetPasswordTokenPrefix = 'ART'

export const KNOWN_CONNECTION_APPEFIDS = {
	PASSWORD: '31fff8fc-ea95-43ac-95c5-902497125b90',
	FACEBOOK: '3ecad13f-52c3-483d-911f-31dbcf2a6d23',
	GOOGLE: '0e6a50f5-b523-4e29-990d-f37fa2ffdd69',
	APPLE: 'ce1be235-3691-4532-906c-5a7d2e3acdd1',
}

export const idpConnectionIdToVendorNames: Record<string, string> = {
	[KNOWN_CONNECTION_APPEFIDS.FACEBOOK]: 'facebook',
	[KNOWN_CONNECTION_APPEFIDS.GOOGLE]: 'google',
}

export type TRANSLATION_KEYS =
	| ERROR_TRANSLATION_KEYS
	| 'templateNotificationTitle'
	| 'templateNotificationMessage'
	| 'containerOk'
	| 'resetPasswordCheckEmailTitle'
	| 'resetPasswordCheckEmailText'
	| 'resetPasswordOk'
	| 'resetPasswordSuccessTitle'
	| 'passwordHasExpiredTitle'
	| 'passwordHasExpiredText'
	| 'passwordHasExpiredOk'
	| 'applySuccess1'
	| 'applySuccess2'
	| 'membersLoginDialogTitle'
	| 'membersLoginDialogSubmitButton'
	| 'membersLoginDialogSwitchDialogLink'
	| 'membersLoginDialogMobileForgotPassword'
	| 'membersLoginDialogForgotPassword'
	| 'membersLoginDialogSwitchToSignUp'
	| 'membersLoginDialogSocialSectionDivider'
	| 'membersLoginDialogEmailSectionDivider'
	| 'membersLoginDialogCopyLinkLoginFacebook'
	| 'membersLoginDialogCopyLinkLoginGoogle'
	| 'membersLoginDialogCopyLinkSignupFacebook'
	| 'membersLoginDialogCopyLinkSignupGoogle'
	| 'membersLoginDialogCopyLinkLoginGoogleFacebook'
	| 'membersLoginDialogCopyLinkSignupGoogleFacebook'
	| 'membersLoginDialogCopyLinkText'
	| 'membersLoginDialogPasswordFieldTitle'
	| 'membersLoginDialogPasswordFieldLabel'
	| 'membersLoginDialogEmailField'
	| 'membersLoginDialogSocialLoginTitle'
	| 'membersLoginDialogLoginWithGoogle'
	| 'membersLoginDialogLoginWithFacebook'
	| 'membersLoginDialogSignupWithGoogle'
	| 'membersLoginDialogSignupWithFacebook'
	| 'membersLoginDialogLoginWithSso'
	| 'membersLoginDialogSignupWithSso'
	| 'membersLoginDialogSwitchToAuthWithEmail'
	| 'membersLoginDialogLinkCopied'
	| 'membersErrorRetypePassword'
	| 'membersErrorPasswordRequired'
	| 'membersErrorPasswordAscii'
	| 'membersErrorPasswordSignupLength'
	| 'membersErrorPasswordLoginLength'
	| 'membersErrorEmailRequired'
	| 'membersErrorEmailFormat'
	| 'membersCloseDialog'
	| 'welcomeTitle'
	| 'welcomeDescription'
	| 'welcomeDescriptionSecondary'
	| 'welcomeEdit'
	| 'welcomeBackToSite'
	| 'noPermissionsToPageTitle'
	| 'noPermissionsToPageSwitchAccount'
	| 'confirmationEmailTitle'
	| 'confirmationEmailSignUpTitle'
	| 'confirmationEmailSubtitle'
	| 'confirmationEmailSignUpSubtitle'
	| 'confirmationEmailSignUpSecondarySubtitle'
	| 'confirmationEmailDescription'
	| 'confirmationEmailDescriptionSecondary'
	| 'confirmationEmailDescriptionLink'
	| 'resetPasswordTitle'
	| 'resetPasswordSubtitle'
	| 'resetPasswordButtonText'
	| 'resetPasswordPasswordInputText'
	| 'resetPasswordRetypePasswordInputText'
	| 'membersPoliciesTermsOfUseLink'
	| 'membersPoliciesPrivacyLink'
	| 'membersPoliciesAnd'
	| 'requestPasswordResetTitle'
	| 'requestPasswordResetEnterEmail'
	| 'requestPasswordResetPasswordResetButton'
	| 'membersSignupSwitchDialogLink'
	| 'membersSignupSwitchToSignIn'
	| 'membersSignupSocialSectionDivider'
	| 'membersSignupSwitchToAuthWithEmail'
	| 'membersSignupCommunityLabel'
	| 'membersSignupCommunityReadMore'
	| 'membersSignupCommunityReadLess'
	| 'membersSignupCommunityContent'
	| 'membersSignupCommunityCodeOfConductLink'
	| 'membersSignupPoliciesContent'
	| 'verificationCodeTitle'
	| 'verificationCodeFooterParagraph'
	| 'verificationCodeFooterParagraphLink'
	| 'verificationCodeResendIndication'
	| 'verificationCodeEnterCode'
	| 'verificationCodeEmailParagraph'
	| 'verificationCodeSubmitButton'
	| 'verificationCodeVerificationErr'
	| 'verificationCodeNotFoundError'
	| 'verificationCodeBadCodeError'
	| 'validationNotMatch'
	| 'validationTooLong'
	| 'validationTooShort'
	| 'dialogMixinTranslations_sso_title'
	| 'dialogMixinTranslations_sso_subtitle'

export type ERROR_TRANSLATION_KEYS =
	| 'membersErrorGeneral'
	| 'membersServerError_19958'
	| 'membersServerError_19995'
	| 'membersServerError_19999'
	| 'membersServerError_18880'
	| 'membersServerError_17005'
	| 'membersServerError_17002'
	| 'membersServerError_17003'
	| 'membersServerError_19970'
	| 'membersServerError_19971'
	| 'membersServerError_19956'
	| 'membersServerError_19973'
	| 'membersServerError_19901'
	| 'membersServerError_19972'
	| 'membersServerError_19976'
	| 'membersServerError_19980'
	| 'membersServerError_19984'
	| 'membersServerError_19988'
	| 'membersServerError_RECOVERY_TOKEN_DATA_NOT_FOUND'

export const ERROR_TRANSLATIONS: {
	[key in ERROR_TRANSLATION_KEYS]: { namespace: string; key: string; default: string }
} = {
	membersErrorGeneral: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_General_Err',
		default: 'Looks like there was a technical issue. Please refresh the browser and log in again.',
	},
	membersServerError_19958: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19958',
		default: 'Unable to log in. Your member request is pending approval.',
	},
	membersServerError_19995: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19995',
		default: 'An account with this email already exists.',
	},
	membersServerError_19999: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19999',
		default: `This email doesn't match any account. Try again.`,
	},
	membersServerError_18880: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_18880',
		default: 'Email address must be provided',
	},
	membersServerError_17005: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_17005',
		default: 'Please enter the correct password.',
	},
	membersServerError_17002: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_17002',
		default: 'This page was deleted. Reload your browser to head home.',
	},
	membersServerError_17003: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_17003',
		default: `This page isn't password protected. To view it, reload your browser.`,
	},
	membersServerError_19970: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19970',
		default: 'Verification failed. Please try again.',
	},
	membersServerError_19971: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19971',
		default: `Captcha is required to verify that you're a human.`,
	},
	membersServerError_19956: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19956',
		default: `It looks like you can't log in with that email. Try a different email address.`,
	},
	membersServerError_19973: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19973',
		default: 'Your password has been reset. To log in, click Forgot Password below & create a new password.',
	},
	membersServerError_19901: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19901',
		default: 'We sent you too many emails. Wait a bit before clicking resend again.',
	},
	membersServerError_19972: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19972',
		default: 'It appears that this link has expired',
	},
	membersServerError_19976: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19976',
		default: 'Wrong email or password',
	},
	membersServerError_19980: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19980',
		default: 'Access denied by site owner',
	},
	membersServerError_19984: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19984',
		default: 'Invalid Session',
	},
	membersServerError_19988: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_19988',
		default: 'Validation Error',
	},
	membersServerError_RECOVERY_TOKEN_DATA_NOT_FOUND: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_RECOVERY_TOKEN_DATA_NOT_FOUND',
		default: 'It appears that this link has expired',
	},
}

export const TRANSLATIONS: { [key in TRANSLATION_KEYS]: { namespace: string; key: string; default: string } } = {
	...ERROR_TRANSLATIONS,
	templateNotificationTitle: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_TEMPLATE_NOTIFICATION_TITLE',
		default: 'Demo Mode',
	},
	templateNotificationMessage: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_TEMPLATE_NOTIFICATION_MESSAGE',
		default: 'To make this template yours, start editing it.',
	},
	containerOk: { namespace: 'siteMembersTranslations', key: 'SMContainer_OK', default: 'OK' },
	resetPasswordCheckEmailTitle: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_RESET_PASSWORD_CHECKEMAIL_TITLE',
		default: 'Please Check Your Email',
	},
	resetPasswordCheckEmailText: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_RESET_PASSWORD_CHECKEMAIL_TEXT',
		default: 'We’ve emailed you a link to reset your password.',
	},
	resetPasswordOk: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_Reset_Password_OK',
		default: 'Got It',
	},
	resetPasswordSuccessTitle: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_Reset_Password_Sucess_Title',
		default: 'Your password has been changed.',
	},
	passwordHasExpiredTitle: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_PASSWORD_HAS_EXPIRED_TITLE',
		default: 'Your link to create a new password has expired',
	},
	passwordHasExpiredText: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_PASSWORD_HAS_EXPIRED_TEXT',
		default: 'To continue, resend a new link to your email.',
	},
	passwordHasExpiredOk: {
		namespace: 'siteMembersTranslations',
		key: 'siteMembersTranslations_PASSWORD_HAS_EXPIRED_OK',
		default: 'Resend Link',
	},
	applySuccess1: {
		namespace: 'siteMembersTranslations',
		key: 'SMApply_Success1',
		default: 'Success! Your member {0} request has been sent and is awaiting approval.',
	},
	applySuccess2: {
		namespace: 'siteMembersTranslations',
		key: 'SMApply_Success2',
		default: 'The site administrator will notify you via email ({0}) once your request has been approved.',
	},
	membersLoginDialogTitle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslation_log_in',
		default: 'Log In',
	},
	membersLoginDialogSubmitButton: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_log_in_btn_new',
		default: 'Log In',
	},
	membersLoginDialogSwitchDialogLink: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRegister_sign_up_new',
		default: 'Sign Up',
	},
	membersLoginDialogMobileForgotPassword: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_forgot_password_mobile_new',
		default: 'Forgot password?',
	},
	membersLoginDialogForgotPassword: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_forgot_password',
		default: 'Forgot password?',
	},
	membersLoginDialogSwitchToSignUp: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_switch_to_signup_material',
		default: 'New to this site?',
	},
	membersLoginDialogSocialSectionDivider: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_or_log_in_with',
		default: 'or log in with',
	},
	membersLoginDialogEmailSectionDivider: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_or_email_new',
		default: 'or',
	},
	membersLoginDialogCopyLinkLoginFacebook: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_copy.login.facebook',
		default: 'To log in with Facebook, copy this page link and open it in another browser.',
	},
	membersLoginDialogCopyLinkLoginGoogle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_copy.login.google',
		default: 'To log in with Google, copy this page link and open it in another browser.',
	},
	membersLoginDialogCopyLinkSignupFacebook: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_copy.signup.facebook',
		default: 'To sign up with Facebook, copy this page link and open it in another browser.',
	},
	membersLoginDialogCopyLinkSignupGoogle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_copy.signup.google',
		default: 'To sign up with Google, copy this page link and open it in another browser.',
	},
	membersLoginDialogCopyLinkLoginGoogleFacebook: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_copy.login.googlefacebook',
		default: 'To log in with Google or Facebook, copy this page link and open it in another browser.',
	},
	membersLoginDialogCopyLinkSignupGoogleFacebook: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_copy.signup.googlefacebook',
		default: 'To sign up with Google or Facebook, copy this page link and open it in another browser.',
	},
	membersLoginDialogCopyLinkText: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_copy_link',
		default: 'Copy link',
	},
	membersLoginDialogPasswordFieldTitle: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Password',
		default: 'Password',
	},
	membersLoginDialogPasswordFieldLabel: {
		namespace: 'dialogMixinTranslations',
		key: 'PasswordLogin_Password',
		default: 'Password',
	},
	membersLoginDialogEmailField: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Email',
		default: 'Email',
	},
	membersLoginDialogSocialLoginTitle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_social_login',
		default: 'Social login',
	},
	membersLoginDialogLoginWithGoogle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_login_google',
		default: 'Log in with Google',
	},
	membersLoginDialogLoginWithFacebook: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_login_facebook',
		default: 'Log in with Facebook',
	},
	membersLoginDialogSignupWithGoogle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_signup_google',
		default: 'Sign up with Google',
	},
	membersLoginDialogSignupWithFacebook: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_signup_facebook',
		default: 'Sign up with Facebook',
	},
	membersLoginDialogLoginWithSso: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_login_sso',
		default: 'Log in with SSO',
	},
	membersLoginDialogSignupWithSso: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_signup_sso',
		default: 'Sign up with SSO',
	},
	membersLoginDialogSwitchToAuthWithEmail: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_login_switch_email',
		default: 'Log in with Email',
	},
	membersLoginDialogLinkCopied: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_link_copied',
		default: 'Link Copied',
	},
	membersErrorRetypePassword: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_Password_Retype',
		default: 'Passwords do not match. Try again.',
	},
	membersErrorPasswordRequired: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_Password_Blank',
		default: 'Make sure you enter a password.',
	},
	membersErrorPasswordAscii: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_Non_Ascii_Chars',
		default: 'Password must contain only ASCII characters',
	},
	membersErrorPasswordSignupLength: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_Password_Length',
		default: 'Password length must be between {0} and {1} characters.',
	},
	membersErrorPasswordLoginLength: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_Password_Length_Login',
		default: 'Passwords must be at least 4 characters long. Try again.',
	},
	membersErrorEmailRequired: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_Email_Blank',
		default: 'Email cannot be blank',
	},
	membersErrorEmailFormat: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_Email_Invalid',
		default: 'Double check your email and try again.',
	},
	membersCloseDialog: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_Close_Dialog',
		default: 'Close',
	},
	welcomeTitle: {
		namespace: 'SM',
		key: 'SMWelcome_Title',
		default: 'Welcome To Your Account!',
	},
	welcomeDescription: {
		namespace: 'SM',
		key: 'SMWelcome_SomeInfo',
		default: `We have some info from when you've been to our site before.`,
	},
	welcomeDescriptionSecondary: {
		namespace: 'SM',
		key: 'SMWelcome_Check',
		default: 'Check that everything is correct.',
	},
	welcomeEdit: {
		namespace: 'SM',
		key: 'SMWelcome_Edit',
		default: 'Edit Account Info',
	},
	welcomeBackToSite: {
		namespace: 'SM',
		key: 'SMWelcome_Back',
		default: 'Back to site',
	},
	noPermissionsToPageTitle: {
		namespace: 'SM',
		key: 'SMNoPermissions',
		default: `You don't have permissions to access this page.`,
	},
	noPermissionsToPageSwitchAccount: {
		namespace: 'SM',
		key: 'SMSwitchAccount',
		default: 'Switch Account',
	},
	confirmationEmailTitle: {
		namespace: 'SM',
		key: 'SMEmailVerification_EmailConfirmationSent',
		default: 'We’ve Sent a Confirmation Email',
	},
	confirmationEmailSignUpTitle: {
		namespace: 'SM',
		key: 'SMEmailVerification_Title',
		default: 'Confirm Your Email To Get Started',
	},
	confirmationEmailSubtitle: {
		namespace: 'SM',
		key: 'SMEmailVerification_CheckYourInbox',
		default: 'Check your inbox',
	},
	confirmationEmailSignUpSubtitle: {
		namespace: 'SM',
		key: 'SMEmailVerification_Thanks',
		default: 'Thanks for signing up! We sent you a confirmation email.',
	},
	confirmationEmailSignUpSecondarySubtitle: {
		namespace: 'SM',
		key: 'SMEmailVerification_ClickTheLink',
		default: 'Click the link in the email to get to your account.',
	},
	confirmationEmailDescription: {
		namespace: 'SM',
		key: 'SMEmailVerification_DidntGetEmail',
		default: 'Didn’t get the email?',
	},
	confirmationEmailDescriptionSecondary: {
		namespace: 'SM',
		key: 'SMEmailVerification_CheckSpam',
		default: 'Check your spam folder or ',
	},
	confirmationEmailDescriptionLink: {
		namespace: 'SM',
		key: 'SMEmailVerification_ResendLink',
		default: 'click here to resend confirmation email.',
	},
	resetPasswordTitle: {
		namespace: 'dialogMixinTranslations',
		key: 'SMResetPassMail_title',
		default: 'Reset password',
	},
	resetPasswordSubtitle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_RESET_PASSWORD_TEXT',
		default: 'Enter your new password below',
	},
	resetPasswordButtonText: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_RESET_PASSWORD_BUTTON',
		default: 'Reset Password',
	},
	resetPasswordPasswordInputText: {
		namespace: 'dialogMixinTranslations',
		key: 'SMResetPass_New_Password',
		default: 'Enter a new password',
	},
	resetPasswordRetypePasswordInputText: {
		namespace: 'dialogMixinTranslations',
		key: 'SMResetPass_Retype_Password',
		default: 'Confirm new password',
	},
	membersPoliciesTermsOfUseLink: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_TermsOfUse_new',
		default: 'Terms of Use',
	},
	membersPoliciesPrivacyLink: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_PrivacyPolicy_new',
		default: 'Privacy Policy',
	},
	membersPoliciesAnd: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_And_new',
		default: 'and',
	},
	requestPasswordResetTitle: {
		namespace: 'dialogMixinTranslations',
		key: 'SMResetPassMail_title',
		default: 'Reset password',
	},
	requestPasswordResetEnterEmail: {
		namespace: 'dialogMixinTranslations',
		key: 'SMResetPassMail_Enter_Email',
		default: 'Enter your login email and we’ll send you a link to reset your password.',
	},
	requestPasswordResetPasswordResetButton: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_RESET_PASSWORD_BUTTON',
		default: 'Reset Password',
	},
	membersSignupSwitchDialogLink: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_Log_In',
		default: 'Log In',
	},
	membersSignupSwitchToSignIn: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRegister_Already_Have_User',
		default: 'Already a member?',
	},
	membersSignupSocialSectionDivider: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_or_sign_up_with',
		default: 'or sign up with',
	},
	membersSignupSwitchToAuthWithEmail: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_signup_switch_email',
		default: 'Sign up with email',
	},
	membersSignupCommunityLabel: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_Join_Community_Label_new',
		default: 'Sign up to this site with a public profile.',
	},
	membersSignupCommunityReadMore: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_Join_Community_Link_new',
		default: 'Read more',
	},
	membersSignupCommunityReadLess: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_Join_Community_Link_Less_new',
		default: 'Read less',
	},
	membersSignupCommunityContent: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_Join_Community_Read_More_Content_new',
		default:
			'Your profile will be set to public automatically when you sign up. You can change this later in your profile settings.',
	},
	membersSignupCommunityCodeOfConductLink: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_CodeOfConduct_new',
		default: 'Read Code of Conduct',
	},
	membersSignupPoliciesContent: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Policies_Agreement_new',
		default: 'By signing up, you agree to our',
	},
	verificationCodeTitle: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_title',
		default: 'Confirm your email',
	},
	verificationCodeFooterParagraph: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_footerParagraph',
		default: `Didn't get the email? Check your spam.`,
	},
	verificationCodeFooterParagraphLink: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_footerParagraph_Link',
		default: 'Resend Code',
	},
	verificationCodeResendIndication: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_resendIndication',
		default: 'Code was sent. You can resend in',
	},
	verificationCodeEnterCode: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_enter_code',
		default: 'Enter 6-digit code',
	},
	verificationCodeEmailParagraph: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_to_email',
		default: 'To finish signing up, confirm your email by entering the 6-digit code we sent\nto: ',
	},
	verificationCodeSubmitButton: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_submitButton',
		default: 'Confirm & Sign Up',
	},
	verificationCodeVerificationErr: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_EMAIL_VERIFICATION_FAILED',
		default: 'Email verification failed',
	},
	verificationCodeNotFoundError: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_Code_NOT_FOUND',
		default: 'This code has expired. Resend code to get a new one.',
	},
	verificationCodeBadCodeError: {
		namespace: 'dialogMixinTranslations',
		key: 'SMRVerificationCode_Dialog_Code_BAD_CODE',
		default: 'This code is incorrect. Double check your confirmation email and try again.',
	},
	validationNotMatch: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_VALUE_DID_NOT_MATCH',
		default: 'provided value did not match pattern',
	},
	validationTooLong: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_VALUE_TOO_LONG',
		default: 'provided password was too long',
	},
	validationTooShort: {
		namespace: 'dialogMixinTranslations',
		key: 'SMForm_Error_VALUE_TOO_SHORT',
		default: 'provided password was too short',
	},
	dialogMixinTranslations_sso_title: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_sso_title',
		default: 'Log in with your organization account.',
	},
	dialogMixinTranslations_sso_subtitle: {
		namespace: 'dialogMixinTranslations',
		key: 'dialogMixinTranslations_sso_subtitle',
		default: 'Your organization requires login with SSO. Continue with SSO to enter this site.',
	},
}
