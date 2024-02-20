import fastdom from 'fastdom'
import { ViewerModel } from '@wix/thunderbolt-symbols'
import { mediaResizeMap } from '@wix/animations-kit'
import wixCustomElementsRegistry from '@wix/custom-elements'
import { initCustomElement as initWowImageCustomElement } from '@wix/image'

type CustomElementsMediaData = Pick<ViewerModel, 'experiments' | 'media' | 'requestUrl'>
type MediaServicesOverride = {
	getScreenHeightOverride: () => number
}
type EnvironmentOverrides = {
	disableImagesLazyLoading: boolean
}

const getSiteService = () => ({
	getSiteScale: () => {
		// We can replace later with better logic
		const siteRootElement = document.querySelector<HTMLDivElement>('#site-root')
		if (siteRootElement) {
			return siteRootElement.getBoundingClientRect().width / siteRootElement.offsetWidth
		}
		return 1
	},
})

const initWixCustomElementsRegistry = () => {
	const resizeService = {
		init: (callback: any) => new ResizeObserver(callback),
	}

	const windowResizeService = {
		init: (callback: any) => window.addEventListener('resize', callback),
	}

	const siteService = getSiteService()

	return wixCustomElementsRegistry.init({ resizeService, windowResizeService, siteService })
}

const getMediaDimensionsByEffect = (bgEffectName: string, width: number, height: number, screenHeight: number) => {
	const { getMediaDimensions, ...rest } = mediaResizeMap[bgEffectName as keyof typeof mediaResizeMap] || {}
	return getMediaDimensions
		? { ...getMediaDimensions(width, height, screenHeight), ...rest }
		: { width, height, ...rest }
}

const buildCustomElementsMediaParams = (
	partialViewerModel: CustomElementsMediaData,
	wixCustomElements?: any,
	mediaOverrideParam?: MediaServicesOverride,
	environmentOverrides?: EnvironmentOverrides
) => {
	const getDevicePixelRatio = () => {
		const isMSMobileDevice = /iemobile/i.test(navigator.userAgent)
		if (isMSMobileDevice) {
			return Math.round(
				window.screen.availWidth / (window.screen.width || window.document.documentElement.clientWidth)
			)
		}
		return window.devicePixelRatio
	}

	const isExperimentOpen = (experiment: string) => Boolean(partialViewerModel.experiments[experiment])

	const environmentConsts = {
		staticMediaUrl: partialViewerModel.media.staticMediaUrl,
		mediaRootUrl: partialViewerModel.media.mediaRootUrl,
		experiments: {},
		isViewerMode: true,
		devicePixelRatio: getDevicePixelRatio(),
		...environmentOverrides,
	}

	const services = {
		mutationService: fastdom,
		isExperimentOpen,
		siteService: getSiteService(),
	}
	const mediaServices = { getMediaDimensionsByEffect, ...services, ...mediaOverrideParam }

	return {
		...partialViewerModel,
		wixCustomElements: wixCustomElements || initWixCustomElementsRegistry(),
		services,
		environmentConsts,
		mediaServices,
	}
}

export const initCustomElements = (
	partialViewerModelParam: CustomElementsMediaData,
	wixCustomElementsParam?: any,
	mediaOverrideParam?: MediaServicesOverride,
	environmentOverrides?: EnvironmentOverrides
) => {
	const { environmentConsts, wixCustomElements, media, requestUrl, mediaServices } = buildCustomElementsMediaParams(
		partialViewerModelParam,
		wixCustomElementsParam,
		mediaOverrideParam,
		environmentOverrides
	)
	const contextWindow = wixCustomElements?.contextWindow || window
	contextWindow.wixCustomElements = wixCustomElements
	Object.assign(contextWindow.customElementNamespace, {
		mediaServices,
		environmentConsts,
		requestUrl,
		staticVideoUrl: media.staticVideoUrl,
	})

	initWowImageCustomElement({ ...mediaServices }, wixCustomElements.contextWindow, environmentConsts)

	wixCustomElements.defineWixImage(mediaServices, environmentConsts)
	wixCustomElements.defineWixBgMedia(mediaServices)
	window.__imageClientApi__ = wixCustomElementsRegistry.imageClientApi
}
