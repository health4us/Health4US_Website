import { multi, withDependencies } from '@wix/thunderbolt-ioc'
import {
	CssFetcherSymbol,
	DomReadySymbol,
	HeadContentSymbol,
	ICssFetcher,
	IHeadContent,
	IPageResourceFetcher,
	PageResourceFetcherSymbol,
} from '@wix/thunderbolt-symbols'

export type ILoadPageStyle = {
	load(pageId: string): Promise<void>
}

export const PageMainCssFetcher = withDependencies<ICssFetcher>(
	[PageResourceFetcherSymbol],
	(pageResourceFetcher: IPageResourceFetcher) => ({
		id: 'css',
		fetch: (pageId) => pageResourceFetcher.fetchResource(pageId, 'css'),
	})
)

const toDomId = (id: string, pageId: string) => `${id}_${pageId}`

export const ClientPageStyleLoader = withDependencies<ILoadPageStyle>(
	[DomReadySymbol, multi(CssFetcherSymbol)],
	(domReadyPromise: Promise<void>, cssFetchers: Array<ICssFetcher>) => {
		return {
			async load(pageId): Promise<void> {
				await domReadyPromise

				await Promise.all(
					cssFetchers.map(async (cssFetcher) => {
						const id = toDomId(cssFetcher.id, pageId)
						if (document.getElementById(id)) {
							return
						}

						const { css } = await cssFetcher.fetch(pageId)

						const styleElement = window.document.createElement('style')
						styleElement.setAttribute('id', id)
						styleElement.innerHTML = css
						window.document.getElementById('pages-css')!.appendChild(styleElement)
					})
				)
			},
		}
	}
)

export const ServerPageStyleLoader = withDependencies<ILoadPageStyle>(
	[HeadContentSymbol, multi(CssFetcherSymbol)],
	(headContent: IHeadContent, cssFetchers: Array<ICssFetcher>) => {
		return {
			async load(pageId) {
				const results = await Promise.all(
					cssFetchers.map(async ({ id, fetch }) => {
						const { css } = await fetch(pageId)
						return {
							id,
							css,
						}
					})
				)
				results.forEach(({ id, css }) => {
					headContent.addPageCss(`<style id="${toDomId(id, pageId)}">${css}</style>`)
				})
			},
		}
	}
)
