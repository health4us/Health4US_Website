export type IHeadContent = {
	setHead: (content: string, type?: HeadContentType) => void
	getHead: () => string
	getHeadSeoMarkup: () => string
	getHeadMarkupByType: (type: HeadContentType) => string
	addPageCss: (css: string) => void
	getPagesCss: () => string
	addCustomCss: (css: string) => void
	getCustomCss: () => string
	addScriptToPreloadList: (url: string) => void
	getScriptPreloadList: () => Array<string>
	addByocCss: (css: string) => void
	getByocCss: () => string
}
export enum HeadContentType {
	SEO = 'seo',
	SEO_DEBUG = 'seo_debug',
	GENERAL = 'general',
}
