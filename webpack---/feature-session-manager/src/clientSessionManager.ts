import _ from 'lodash'
import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	Fetch,
	IFetchApi,
	SiteFeatureConfigSymbol,
	ILogger,
	LoggerSymbol,
	SdkHandlersProvider,
	BrowserWindow,
	BrowserWindowSymbol,
	DynamicSessionModel,
	FeatureExportsSymbol,
	METASITE_APP_DEF_ID,
} from '@wix/thunderbolt-symbols'
import type {
	SessionManagerSiteConfig,
	ISessionManager,
	SessionHandlers,
	LoadNewSessionReason,
	OnLoadSessionCallback,
	ISessionProvider,
} from './types'
import { IFeatureExportsStore } from 'thunderbolt-feature-exports'
import { name, sessionExportsNamespace, SessionProviderSymbol } from './symbols'
import { DEFAULT_EXPIRATION_TIME } from './constants'

export const SessionManager = withDependencies(
	[
		BrowserWindowSymbol,
		named(SiteFeatureConfigSymbol, name),
		Fetch,
		LoggerSymbol,
		named(FeatureExportsSymbol, name),
		SessionProviderSymbol,
	],
	(
		browserWindow: BrowserWindow,
		siteFeatureConfig: SessionManagerSiteConfig,
		fetchApi: IFetchApi,
		logger: ILogger,
		sessionExports: IFeatureExportsStore<typeof sessionExportsNamespace>,
		sessionProvider: ISessionProvider
	): ISessionManager & SdkHandlersProvider<SessionHandlers> => {
		let sessionTimeoutPointer: number

		const isRunningInDifferentSiteContext = siteFeatureConfig.isRunningInDifferentSiteContext

		const onLoadSessionCallbacks: Set<OnLoadSessionCallback> = new Set()

		const addLoadNewSessionCallback = (callback: OnLoadSessionCallback) => {
			onLoadSessionCallbacks.add(callback)
			return () => onLoadSessionCallbacks.delete(callback)
		}

		const invokeSessionLoadCallbacks = (reason: LoadNewSessionReason) => {
			const { apps, siteMemberId, visitorId, svSession, smToken } = sessionModel
			const instances = _.mapValues(apps, 'instance')

			onLoadSessionCallbacks.forEach((callback) => {
				callback({
					results: { instances, siteMemberId, visitorId, svSession, smToken },
					reason,
				})
			})
		}

		const sessionModel: Partial<DynamicSessionModel> = Object.assign(
			siteFeatureConfig.sessionModel,
			sessionProvider.getCurrentSession()
		)
		const metaSiteAppId = sessionModel.apps?.[METASITE_APP_DEF_ID]
		if (metaSiteAppId) {
			logger.updateApplicationsMetaSite(metaSiteAppId.instance)
		}
		invokeSessionLoadCallbacks('firstLoad')

		const getAllInstances = () => {
			return sessionModel.apps || {}
		}

		const getAppInstanceByAppDefId = (appDefId: string): string | undefined => {
			return getAllInstances()[appDefId]?.instance
		}

		const loadNewSession: ISessionManager['loadNewSession'] = async (options = { reason: 'noSpecificReason' }) => {
			try {
				const newSession = await sessionProvider.loadNewSession(options)
				Object.assign(sessionModel, newSession)
				invokeSessionLoadCallbacks(options.reason)
			} catch (error) {
				logger.captureError(new Error(`failed loading new session`), {
					tags: { feature: 'session-manager' },
					extra: { errorMessage: error.message },
				})
			}
			setNextSessionRefresh()
		}

		const setNextSessionRefresh = () => {
			if (!isRunningInDifferentSiteContext) {
				setSessionTimeout()
			}
		}

		const setSessionTimeout = () => {
			if (sessionTimeoutPointer) {
				browserWindow!.clearTimeout(sessionTimeoutPointer)
			}

			sessionTimeoutPointer = browserWindow!.setTimeout(
				() => loadNewSession({ reason: 'expiry' }),
				siteFeatureConfig.expiryTimeoutOverride || DEFAULT_EXPIRATION_TIME
			)
		}
		const getVisitorId = () => sessionModel.visitorId

		sessionExports.export({
			getVisitorId,
			getAppInstanceByAppDefId,
		})

		// set initial timeout / message registrar for refresh
		setNextSessionRefresh()

		return {
			getAllInstances,
			getAppInstanceByAppDefId,
			getSiteMemberId() {
				return sessionModel.siteMemberId
			},
			getSmToken() {
				return sessionModel.smToken
			},
			getVisitorId,
			loadNewSession,
			addLoadNewSessionCallback,
			getHubSecurityToken() {
				return String(sessionModel.hs || 'NO_HS')
			},
			getUserSession() {
				return sessionModel.svSession
			},
			getCtToken() {
				return sessionModel.ctToken
			},
			setUserSession(svSession: string) {
				sessionModel.svSession = svSession
				// invokeSessionLoadCallbacks('newUserSession') // TODO potential breaking change, deserves it's own commit
			},
			getSdkHandlers: () => ({
				getMediaAuthToken: () => Promise.resolve(sessionModel.mediaAuthToken),
				loadNewSession,
				addLoadNewSessionCallback: async (callback) => addLoadNewSessionCallback(callback),
			}),
		}
	}
)
