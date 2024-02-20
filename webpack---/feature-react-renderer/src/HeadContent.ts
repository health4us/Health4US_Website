import { withDependencies } from '@wix/thunderbolt-ioc'
import { HeadContentType, IHeadContent } from '@wix/thunderbolt-symbols'

type HeadContentFactory = () => IHeadContent

const headContent: HeadContentFactory = () => {
	const headStatic: Record<string, string> = {}
	const headOther: Array<string> = []
	const pagesCss: Array<string> = []
	const customCss: Array<string> = []
	const byocCss: Array<string> = []
	const urlsToPreload: Array<string> = []
	return {
		setHead: (content: string, type?: HeadContentType) => {
			switch (type) {
				case HeadContentType.SEO:
				case HeadContentType.SEO_DEBUG:
					headStatic[type] = content
					break
				default:
					headOther.push(content)
					break
			}
		},
		addPageCss: (css) => pagesCss.push(css),
		getPagesCss: () => pagesCss.join('\n'),
		addCustomCss: (css) => customCss.push(css),
		getCustomCss: () => customCss.join('\n'),
		addByocCss: (css) => byocCss.push(css),
		getByocCss: () => byocCss.join('\n'),
		addScriptToPreloadList: (url: string) => urlsToPreload.push(url),
		getScriptPreloadList: () => urlsToPreload,
		getHead: () => {
			return [...Object.values(headStatic), ...headOther].join('\n')
		},
		getHeadSeoMarkup: (): string => {
			return [headStatic[HeadContentType.SEO], headStatic[HeadContentType.SEO_DEBUG]].join('\n')
		},
		getHeadMarkupByType: (type: HeadContentType): string => {
			switch (type) {
				case HeadContentType.SEO:
				case HeadContentType.SEO_DEBUG:
					return headStatic[type]
				default:
					return headOther.join('\n')
			}
		},
	}
}

export const HeadContent = withDependencies([], headContent)
