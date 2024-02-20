import _ from 'lodash'
import type { ISiteScrollBlocker } from 'feature-site-scroll-blocker'
import type { IPageScrollRegistrar } from 'feature-page-scroll'
import type { IWindowScrollAPI } from 'feature-window-scroll'
import type { FormFactor, ViewMode } from './types'
import LazySentry from './lazySentry'
import type { OOIWidgetConfig } from '@wix/thunderbolt-symbols'

interface HostProps {
	compData: OOIWidgetConfig
	pageId: string
	accessibilityEnabled: boolean
	formFactor: FormFactor
	viewMode: ViewMode
	siteScrollBlocker: ISiteScrollBlocker
	windowScrollApi: IWindowScrollAPI
	registerToThrottledScroll: IPageScrollRegistrar['registerToThrottledScroll']
	fonts: any
	getViewportWidth: () => number
	classNames?: Record<string, string>
}

export const createHostProps = ({
	compData,
	pageId,
	accessibilityEnabled,
	formFactor,
	viewMode,
	siteScrollBlocker,
	windowScrollApi,
	registerToThrottledScroll,
	fonts,
	getViewportWidth,
	classNames,
}: HostProps) => ({
	styleId: compData.styleId,
	pageId,
	accessibilityEnabled,
	id: compData.compId,
	viewMode,
	formFactor,
	dimensions: compData.dimensions,
	isResponsive: compData.isResponsive,
	style: {
		styleParams: compData.style.style,
		siteColors: compData.style.siteColors,
		siteTextPresets: compData.style.siteTextPresets,
		fonts,
	},
	isInFirstFold: compData.isInFirstFold,
	usesCssPerBreakpoint: compData.usesCssPerBreakpoint,
	getAllStyles: () => compData.breakpointsStyles.map(({ params }) => params),
	getCurrentStyle: () => {
		if (!process.env.browser) {
			throw new Error(
				`OOI component ${compData.compId} attempted to invoke host.getCurrentStyle during SSR - this function can only be invoked upon user interaction or mount handlers of the component`
			)
		}
		const currentWidth = getViewportWidth()
		const { params } =
			_.find(compData.breakpointsStyles, ({ bpRange }) => {
				if (bpRange.min && currentWidth < bpRange.min) {
					return false
				}
				if (bpRange.max && currentWidth > bpRange.max) {
					return false
				}
				return true
			}) || {}

		return params
	},
	appLoadBI: {
		loaded: _.noop,
	},
	scrollTo: () => windowScrollApi.scrollToComponent(compData.compId),
	registerToScroll: registerToThrottledScroll,
	blockScroll: () => siteScrollBlocker.setSiteScrollingBlocked(true, compData.compId),
	unblockScroll: () => siteScrollBlocker.setSiteScrollingBlocked(false, compData.compId),
	updateLayout: _.noop,
	// TODO probably santa legacy. try removing this thing and see if things break.
	onSiteReady: (fn: any) => fn(),
	raven: null,
	Effect: null,
	LazySentry,
	classNames,
})
