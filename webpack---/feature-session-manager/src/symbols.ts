export const name = 'sessionManager' as const

export const SessionManagerSymbol = Symbol('SessionManager')
export const DynamicModelSessionProviderSymbol = Symbol('DynamicModelSessionProvider')
export const SessionProviderSymbol = Symbol('SessionProvider')
export const AuthorizationCodeRefreshSymbol = Symbol('AuthorizationCodeRefresh')

export const sessionExportsNamespace = 'session'
