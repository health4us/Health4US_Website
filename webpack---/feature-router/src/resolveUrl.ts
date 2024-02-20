import type { IRoutingConfig, Route, CandidateRouteInfo } from './types'
import { queryParamsWhitelist as defaultQueryParamsWhitelist, overrideSuffix } from './queryParamsWhitelist'
import {
	resolveQueryParams,
	removeProtocol,
	replaceProtocol,
	deprecatedConvertHashBangUrlToSlashUrl,
	getRelativeUrlData,
	decodeUriComponentIfEncoded,
	convertHashBangUrlToSlashUrl,
} from './urlUtils'
import { UrlResolvingOptions } from './types'

const isInternalUrl = (url: string, baseUrl: string): boolean => {
	const parsedUrl = new URL(url, `${baseUrl}/`)
	const parsedBaseUrl = new URL(baseUrl)
	return parsedUrl.host === parsedBaseUrl.host && parsedUrl.pathname.startsWith(parsedBaseUrl.pathname)
}

const getRouteData = (relativePathnameParts: Array<string>, routes: IRoutingConfig['routes']): Route | undefined => {
	const decodedRelativePathnameParts = relativePathnameParts.map(decodeUriComponentIfEncoded)
	const dynamicPageRouteKey = `./${decodedRelativePathnameParts[0]}`
	const routeKey = `./${decodedRelativePathnameParts.join('/')}`

	return routes[routeKey] || routes[dynamicPageRouteKey]
}

export const keepInternalQueryParamsOnly = (
	searchParams: URLSearchParams,
	queryParamsWhitelist: Set<string> = defaultQueryParamsWhitelist
) => {
	// @ts-ignore - ts thinks there's no entries() on searchParams, but it's there.
	const entries = searchParams.entries()
	const filteredEntries = [...entries].filter(
		([key]) => queryParamsWhitelist.has(key) || key.endsWith(overrideSuffix)
	)
	return new URLSearchParams(filteredEntries).toString()
}

const isUrlOnSameWixSite = (candidateUrl: string, baseUrl: string) => {
	const candidateUrlWithNoProtocol = removeProtocol(candidateUrl)
	const baseUrlWithNoProtocol = removeProtocol(baseUrl)

	return candidateUrlWithNoProtocol.startsWith(baseUrlWithNoProtocol)
}

const fixSameWixSiteCandidateUrl = (
	candidateUrl: string,
	siteProtocol: string,
	changeHashBangUrlFixExperimentOn: boolean
) => {
	const candidateSlashUrl = changeHashBangUrlFixExperimentOn
		? convertHashBangUrlToSlashUrl(candidateUrl)
		: deprecatedConvertHashBangUrlToSlashUrl(candidateUrl)
	return replaceProtocol(candidateSlashUrl, siteProtocol)
}

export const resolveUrl = (
	url: string,
	routingConfig: IRoutingConfig,
	options?: UrlResolvingOptions
): Partial<CandidateRouteInfo> => {
	const { currentParsedUrl, queryParamsWhitelist = defaultQueryParamsWhitelist, changeHashBangUrlFixExperimentOn } =
		options || {}
	const isHomePageUrl = url === routingConfig.baseUrl
	const queryParams = currentParsedUrl
		? keepInternalQueryParamsOnly(currentParsedUrl.searchParams, queryParamsWhitelist)
		: ''

	// should resolve to base url on home page url, otherwise we get extra slash on navigation
	const candidateUrl = isHomePageUrl ? routingConfig.baseUrl : url
	const urlToParse = isUrlOnSameWixSite(candidateUrl, routingConfig.baseUrl)
		? fixSameWixSiteCandidateUrl(
				candidateUrl,
				new URL(routingConfig.baseUrl).protocol,
				!!changeHashBangUrlFixExperimentOn
		  )
		: candidateUrl

	const parsedUrl = new URL(urlToParse, `${routingConfig.baseUrl}/`)
	parsedUrl.search = resolveQueryParams(parsedUrl.search, queryParams)

	if (!isInternalUrl(urlToParse, routingConfig.baseUrl)) {
		return {
			parsedUrl,
		}
	}

	const { relativeUrl, relativeEncodedUrl, relativePathnameParts } = getRelativeUrlData(
		urlToParse,
		routingConfig.baseUrl
	)
	const route = getRouteData(relativePathnameParts, routingConfig.routes)

	return {
		...route,
		relativeUrl,
		relativeEncodedUrl,
		parsedUrl,
	}
}
