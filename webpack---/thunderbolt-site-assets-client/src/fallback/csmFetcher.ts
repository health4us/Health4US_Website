import { ILogger, IPlatformLogger } from '@wix/thunderbolt-symbols'
import type { ClientSpec } from '@wix/thunderbolt-ssr-api'

const clientSpecMapPath = 'v1/client-spec-map/public'

export type ClientSpecMap = Record<string, ClientSpec>

export type CsmFetcher = { fetchCsm: () => Promise<ClientSpecMap> }

type CsmFetcherFactory = (payload: {
	fetch: (url: string, options: {}) => Promise<any>
	metaSiteId: string
	siteId: string
	externalBaseUrl: string
	logger?: ILogger | IPlatformLogger
}) => CsmFetcher

class CsmFetcherError extends Error {
	name = 'CsmFetcherError'
}

export const csmFetcher: CsmFetcherFactory = ({ fetch, metaSiteId, siteId, externalBaseUrl = '', logger }) => {
	const metaSiteBaseUrl = '_api/public-csm-server'

	return ({
		fetchCsm: () => {
			const url = `${externalBaseUrl}/${metaSiteBaseUrl}/${clientSpecMapPath}/${metaSiteId}?doNotMutate=true&https=${true}&htmlSiteId=${siteId}`

			return (fetch(url, {
				mode: 'no-cors',
				headers: {
					Accept: 'application/json',
					'Access-Control-Allow-Origin': '*',
					'content-type': 'application/json;charset=utf-8',
				},
			})
				.then(async (res) => {
					if (res.ok) {
						return res.json()
					}
					const err = await res.text()
					throw new CsmFetcherError(err.massage)
				})
				.catch((error) => {
					logger?.captureError(new CsmFetcherError('Failed to fetch fallback csm'), {
						tags: { feature: 'thunderbolt-site-assets-client' },
						extra: { error },
					})
					throw new CsmFetcherError(error)
				}) as unknown) as ClientSpecMap
		},
	} as unknown) as CsmFetcher
}
