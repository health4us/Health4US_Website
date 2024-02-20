import { named, optional, withDependencies } from '@wix/thunderbolt-ioc'
import { isSSR } from '@wix/thunderbolt-commons'
import { AnimationCallbacks, Animations, IAnimations } from 'feature-animations'
import type { IResolvableReadyForScrollPromise, IWindowScrollAPI, WindowScrollPageConfig } from './types'
import { ScrollAnimationResult } from './types'
import { calcScrollDuration } from './scrollUtils'
import {
	BrowserWindowSymbol,
	Experiments,
	ExperimentsSymbol,
	IStructureAPI,
	PageFeatureConfigSymbol,
	Structure,
	ViewMode,
	ViewModeSym,
} from '@wix/thunderbolt-symbols'
import { ILightboxUtils, LightboxUtilsSymbol } from 'feature-lightbox'
import { name, ResolvableReadyForScrollPromiseSymbol } from './symbols'
import { ISiteScrollBlocker, SiteScrollBlockerSymbol } from 'feature-site-scroll-blocker'
import type { SequenceInstance } from '@wix/animations-kit'
import { isElementTabbable } from 'feature-cyclic-tabbing'

const getPosition = (elem: HTMLElement) => window.getComputedStyle(elem).getPropertyValue('position').toLowerCase()

const isElementOrAncestorFixed = (element: HTMLElement) => {
	let elem = element
	while (elem && elem !== window.document.body) {
		if (getPosition(elem) === 'fixed') {
			return true
		}
		elem = elem.offsetParent as HTMLElement
	}
	return false
}

const pxToNumber = (pxSize: string) => Number(pxSize.replace('px', ''))

const getCompClientYForScroll = (
	window: Window,
	compNode: HTMLElement,
	isScrollBlocked: boolean,
	openLightboxId: string | undefined,
	headerComponentId?: string
) => {
	const wixAdsElement = window.document.getElementById('WIX_ADS')
	const wixAdsHeight = wixAdsElement ? wixAdsElement.offsetHeight : 0

	const siteHeaderPlaceholderElement =
		window.document.getElementById('SITE_HEADER-placeholder') ||
		(headerComponentId ? window.document.getElementById(headerComponentId) : null)

	const siteHeaderPlaceholderHeight = siteHeaderPlaceholderElement ? siteHeaderPlaceholderElement.offsetHeight : 0
	const openLightboxElement = openLightboxId && window.document.getElementById(openLightboxId)
	let bodyTop = openLightboxElement
		? openLightboxElement.getBoundingClientRect().top
		: window.document.body.getBoundingClientRect().top

	const compTop = compNode.getBoundingClientRect().top

	if (isScrollBlocked) {
		const siteContainerElement = window.document.getElementById('SITE_CONTAINER')
		bodyTop = siteContainerElement ? pxToNumber(window.getComputedStyle(siteContainerElement).marginTop) : 0
	}

	return compTop - bodyTop - wixAdsHeight - (openLightboxId ? 0 : siteHeaderPlaceholderHeight)
}

const getScrollableElement = (popupUtils?: ILightboxUtils) =>
	popupUtils?.getCurrentLightboxId() ? window.document.getElementById('POPUPS_ROOT')! : window

export const WindowScroll = withDependencies(
	[
		BrowserWindowSymbol,
		ViewModeSym,
		ResolvableReadyForScrollPromiseSymbol,
		SiteScrollBlockerSymbol,
		ExperimentsSymbol,
		Structure,
		named(PageFeatureConfigSymbol, name),
		optional(LightboxUtilsSymbol),
		optional(Animations),
	],
	(
		window: Window,
		viewMode: ViewMode,
		{ readyForScrollPromise }: IResolvableReadyForScrollPromise,
		siteScrollBlockerApi: ISiteScrollBlocker,
		experiments: Experiments,
		structureApi: IStructureAPI,
		{ headerComponentId, headerContainerComponentId }: WindowScrollPageConfig,
		popupUtils?: ILightboxUtils,
		animations?: IAnimations
	): IWindowScrollAPI => {
		let isAnimationRunning = false
		let abortAnimation = () => {}

		if (isSSR(window)) {
			return {
				scrollToComponent: () => Promise.resolve(),
				animatedScrollTo: () => Promise.resolve(ScrollAnimationResult.Aborted),
			}
		}

		const animatedScrollTo = async (
			targetY: number,
			callbacks: AnimationCallbacks = {}
		): Promise<ScrollAnimationResult> => {
			if (!animations) {
				return ScrollAnimationResult.Aborted
			}

			if (!!experiments['specs.thunderbolt.abortScrollAnimationUponStartOfNewScroll'] && isAnimationRunning) {
				abortAnimation()
			}

			isAnimationRunning = true
			const animationInstance = await animations.getInstance()
			await readyForScrollPromise
			const isMobile = viewMode === 'mobile'
			const easingName = isMobile ? 'Quint.easeOut' : 'Sine.easeInOut'
			const duration = calcScrollDuration(window.pageYOffset, targetY, isMobile)
			const scrollableElement = getScrollableElement(popupUtils)

			return new Promise((resolve) => {
				const mergedCallbacks = {
					...callbacks,
					onComplete: (instance: SequenceInstance) => {
						callbacks.onComplete?.(instance)
						removeScrollInteractionEventListeners(animationAbortHandler)
						resolve(ScrollAnimationResult.Completed)
						isAnimationRunning = false
					},
				}

				const gsapInstance = animationInstance.runAnimationOnElements(
					'BaseScroll',
					[scrollableElement as HTMLElement],
					duration,
					0,
					{
						y: targetY,
						ease: easingName,
						callbacks: mergedCallbacks,
					}
				)

				function animationAbortHandler() {
					animationInstance.kill(gsapInstance)
					removeScrollInteractionEventListeners(animationAbortHandler)
					resolve(ScrollAnimationResult.Aborted)
					isAnimationRunning = false
				}
				abortAnimation = animationAbortHandler

				addScrollInteractionEventListeners(animationAbortHandler)
			})
		}

		const scrollToComponent = async (
			targetCompId: string,
			{ callbacks = {}, skipScrollAnimation = false } = {}
		) => {
			await readyForScrollPromise
			const targetElement = window.document.getElementById(targetCompId)!
			const targetCompData = structureApi.get(targetCompId)
			const openLightboxId = popupUtils?.getCurrentLightboxId()
			const isCompOnLightbox = targetCompData?.pageId === openLightboxId
			if (!targetElement || (isElementOrAncestorFixed(targetElement) && !openLightboxId)) {
				return
			}
			const headerContainerElement = headerContainerComponentId
				? window.document.getElementById(headerContainerComponentId)
				: undefined
			const isHeaderSticky = headerContainerElement
				? window.getComputedStyle(headerContainerElement).position === 'sticky'
				: false
			const isHeaderComponentExperimentActive = !!experiments['specs.thunderbolt.windowScrollStickyHeader']
			const compClientYForScroll = await new Promise<number>((resolve) => {
				window.requestAnimationFrame(() => {
					resolve(
						getCompClientYForScroll(
							window,
							targetElement,
							siteScrollBlockerApi.isScrollingBlocked(),
							isCompOnLightbox ? openLightboxId : undefined,
							isHeaderSticky && isHeaderComponentExperimentActive ? headerComponentId : undefined
						)
					)
				})
			})
			if (skipScrollAnimation) {
				window.scrollTo({ top: 0 })
			} else {
				const result = await animatedScrollTo(compClientYForScroll, callbacks)

				if (result !== ScrollAnimationResult.Aborted) {
					const compClientYForScrollAfterScroll = getCompClientYForScroll(
						window,
						targetElement,
						siteScrollBlockerApi.isScrollingBlocked(),
						openLightboxId,
						isHeaderSticky && isHeaderComponentExperimentActive ? headerComponentId : undefined
					)

					const isStickyElement = getPosition(targetElement) === 'sticky'
					const shouldRetryScroll =
						!isStickyElement && compClientYForScroll !== compClientYForScrollAfterScroll

					if (shouldRetryScroll) {
						// if the anchor original position changed due to dynamic
						// content above it height change pushing anchor down
						// we need to perform scroll logic again until reaching the anchor
						scrollToComponent(targetCompId, { callbacks, skipScrollAnimation })
					}
				}
			}

			if (!isElementTabbable(targetElement)) {
				targetElement.setAttribute('tabIndex', '-1')
			}
			targetElement.focus({ preventScroll: true })
		}

		function addScrollInteractionEventListeners(handler: () => void) {
			window.addEventListener('touchmove', handler, { passive: true })
			window.addEventListener('wheel', handler, { passive: true })
		}

		function removeScrollInteractionEventListeners(handler: () => void) {
			window.removeEventListener('touchmove', handler)
			window.removeEventListener('wheel', handler)
		}

		return {
			animatedScrollTo,
			scrollToComponent,
		}
	}
)
