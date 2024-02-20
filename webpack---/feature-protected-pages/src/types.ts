import type { CandidateRouteInfo } from 'feature-router'

export type PageUriSeoToRouterPrefix = { [url: string]: string }

export type ProtectedPagesSiteConfig = {
	passwordProtected: { [pageId: string]: string }
	publicPageIds: Array<string>
	pageUriSeoToRouterPrefix: PageUriSeoToRouterPrefix
}

export type ProtectedPageMasterPageConfig = {
	customNoPermissionsPageUriSeo: string
	pagesSecurity: {
		[pageId: string]: {
			requireLogin: boolean
			passwordDigest: string
		}
	}
	customNoPermissionsPageId: string
}

export type PagesMap = { [pageId: string]: string }

export type ProtectedPagesState = {
	pagesMap: PagesMap
	loginAndNavigate: (routerInfo: Partial<CandidateRouteInfo>, loginType: LoginTypes) => Promise<boolean>
	authenticateUsingSitePassword: (routerInfo: Partial<CandidateRouteInfo>) => Promise<void>
	completedSitePasswordAuth: boolean
}

export interface IProtectedPagesApi {
	getPageJsonFileName(pageId: string): string | null
}

export enum LoginTypes {
	SM = 'SM',
	Pass = 'PASS',
	NONE = 'NONE',
}
