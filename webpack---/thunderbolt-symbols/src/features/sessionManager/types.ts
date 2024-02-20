export type DynamicSessionModel = {
	apps: {
		[appDefId: string]: {
			instance: string
		}
	}
	ctToken: string
	hs: number
	mediaAuthToken: string
	svSession: string
	visitorId: string
	siteMemberId?: string
	smToken?: string
}

export type Instance = string
export type LoadNewSessionReason =
	| 'noSpecificReason'
	| 'memberLogin'
	| 'expiry'
	| 'newUserSession'
	| 'firstLoad'
	| 'authorization code expiry'

export const AUTHORIZATION_CODE_QUERY_PARAM = 'authorizationCode'

export type OnLoadSessionCallback = ({
	results,
	reason,
}: {
	results: {
		instances: { [appDefinitionId: string]: Instance }
		siteMemberId?: string
		visitorId?: string
		svSession?: string
		smToken?: string
	}
	reason: LoadNewSessionReason
}) => void

export interface ISessionManager {
	getAppInstanceByAppDefId(appDefId: string): string | undefined
	getSiteMemberId(): string | undefined
	getVisitorId(): string | undefined
	getSmToken(): string | undefined
	getUserSession(): string | undefined
	getCtToken(): string | undefined
	getAllInstances(): DynamicSessionModel['apps']
	getHubSecurityToken(): string | 'NO_HS'
	setUserSession(userSession: string): void
	addLoadNewSessionCallback(callback: OnLoadSessionCallback): () => void
	// @ts-ignore
	loadNewSession({
		reason,
		authorizationCode,
	}?: {
		reason: LoadNewSessionReason
		authorizationCode?: string
	}): Promise<void>
}
