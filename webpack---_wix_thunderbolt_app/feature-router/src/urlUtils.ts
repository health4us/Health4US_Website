import { CandidateRouteInfo } from './types'

const HASH_BANG_URL_REGEX = /(.*)#!(.*?)[\\/|]([^\\/]+)\/?(.*$)/i
export const resolveQueryParams = (oldQueryParams: string, newQueryParams: string): string => {
	if (newQueryParams !== '') {
		const existingQueryParams = oldQueryParams ? oldQueryParams + '&' : oldQueryParams
		const mergedQueryParams = new URLSearchParams(existingQueryParams + newQueryParams)
		mergedQueryParams.forEach((val, key) => mergedQueryParams.set(key, val))
		return mergedQueryParams.toString()
	} else {
		return oldQueryParams
	}
}

export const removeProtocol = (url: string) => url.replace(/^https?:\/\//, '')

export const replaceProtocol = (url: string, protocol: string) => {
	const linkWithoutProtocol = url.startsWith('//')
	if (linkWithoutProtocol) {
		return `${protocol}${url}`
	}

	return url.replace(/^https?:/, protocol)
}
export const decodeUriComponentIfEncoded = (uriStr: string) => {
	try {
		return decodeURIComponent(uriStr)
	} catch (e) {
		return uriStr
	}
}

export const removeUrlHash = (url: string) => {
	const urlObj = new URL(url)
	urlObj.hash = ''
	const queryParam = urlObj.search || ''
	if (urlObj.pathname === '/') {
		return `${urlObj.origin}${queryParam}`
	}

	return decodeUriComponentIfEncoded(urlObj.href)
}

export const removeQueryParams = (url: string) => {
	const urlObj = new URL(url)
	urlObj.search = ''
	const hash = urlObj.hash || ''
	if (urlObj.pathname === '/') {
		return `${urlObj.origin}${hash}`
	}

	return decodeUriComponentIfEncoded(urlObj.href)
}
export const getUrlHash = (url: string) => {
	const urlObj = new URL(url)
	const hash = urlObj.hash || ''
	return hash.replace('#', '')
}

export const deprecatedConvertHashBangUrlToSlashUrl = (url: string) => {
	const isHashBangUrl = HASH_BANG_URL_REGEX.test(url)
	if (isHashBangUrl) {
		const [, urlWithoutHashBangSuffix, pageUriSeo] = url.match(HASH_BANG_URL_REGEX)!
		return `${urlWithoutHashBangSuffix}${pageUriSeo}`
	}

	return url
}

export const convertHashBangUrlToSlashUrl = (url: string) => {
	const splitHashBang = url.split('#!')
	if (splitHashBang.length > 1) {
		const splitQueryParams = splitHashBang[0].split('?')
		const baseUrl = splitQueryParams[0]
		const queryParams = splitQueryParams[1] ? `?${splitQueryParams[1]}` : ''
		const maybeOtherPageUriSEO = splitHashBang[1].split('/')[0] || ''
		const baseUrlWithTrailingSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
		return `${baseUrlWithTrailingSlash}${maybeOtherPageUriSEO}${queryParams}`
	}

	return url
}

export const getContextByRouteInfo = ({ type, pageId, relativeEncodedUrl }: CandidateRouteInfo) => {
	// we use relativeEncodedUrl for support new line symbol, relevant for dynamic pages
	const [, additionalRoute] = relativeEncodedUrl.match(/\.\/.*?\/(.*$)/) || []
	return type === 'Dynamic' && additionalRoute ? `${pageId}_${additionalRoute}` : `${pageId}`
}

export const removeTrailingSlashAndQueryParams = (url: string) => url.replace(/\/?(\?.*)?$/, '')

export const getRelativeUrl = (url: string, baseUrl: string) => getRelativeUrlData(url, baseUrl).relativeUrl

export const getRelativeEncodedUrl = (url: string, baseUrl: string) =>
	getRelativeUrlData(url, baseUrl).relativeEncodedUrl

const getRelativePathname = (url: string, baseUrl: string): string => {
	const parsedUrl = new URL(url, `${baseUrl}/`)
	const parsedBaseUrl = new URL(baseUrl)

	return parsedUrl.pathname.replace(parsedBaseUrl.pathname, '')
}

const removeLeadingAndTrailingSlash = (str: string): string => /^\/?(.*?)\/?$/.exec(str)![1]

const getPathnameDecodedParts = (relativePathname: string) => {
	const cleanPath = removeLeadingAndTrailingSlash(relativePathname)

	return decodeUriComponentIfEncoded(cleanPath).split('/')
}

const getPathnameParts = (relativePathname: string) => removeLeadingAndTrailingSlash(relativePathname).split('/')

const pathnamePartsToRelativeUrl = (pathnameParts: Array<string>): string => `./${pathnameParts.join('/')}`

export const getRelativeUrlData = (
	url: string,
	baseUrl: string
): {
	relativePathnameParts: Array<string>
	relativeUrl: string
	relativeEncodedUrl: string
} => {
	const relativePathname = getRelativePathname(url, baseUrl)
	const relativePathnameParts = getPathnameDecodedParts(relativePathname)
	const relativeUrl = pathnamePartsToRelativeUrl(relativePathnameParts)
	const relativeEncodedUrl = pathnamePartsToRelativeUrl(getPathnameParts(relativePathname))

	return {
		relativePathnameParts,
		relativeUrl,
		relativeEncodedUrl,
	}
}
