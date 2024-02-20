import _ from 'lodash'
import { withDependencies, optional, named } from '@wix/thunderbolt-ioc'
import { hasNavigator, isSSR } from '@wix/thunderbolt-commons'
import {
	BrowserWindow,
	BrowserWindowSymbol,
	SdkHandlersProvider,
	ViewModeSym,
	ViewMode,
	IMultilingual,
	IStructureAPI,
	StructureAPI,
	PageFeatureConfigSymbol,
	TpaPopupSymbol,
	ITpaPopup,
	DynamicFeatureLoader,
	IPageFeatureLoader,
	Experiments,
	ExperimentsSymbol,
	TpaMessageContextPickerSym,
	TpaContextPicker,
} from '@wix/thunderbolt-symbols'
import type { Language } from '@wix/thunderbolt-becky-types'
import { ILightbox, LightboxSymbol } from 'feature-lightbox'
import { IReporterApi, ReporterSymbol } from 'feature-reporter'
import { Animations, IAnimations } from 'feature-animations'
import { IWindowScrollAPI, WindowScrollApiSymbol, ScrollAnimationResult } from 'feature-window-scroll'
import { MultilingualSymbol } from 'feature-multilingual'
import { ITpaModal, TpaModalSymbol } from 'feature-tpa'
import type { WindowWixCodeSdkHandlers, WindowWixCodeSdkPageConfig } from '../types'
import { name } from '../symbols'

function setCurrentLanguage(languageCode: Language): never {
	throw new Error(`language code "${languageCode}" is invalid`)
}

export const windowWixCodeSdkPageHandlers = withDependencies(
	[
		named(PageFeatureConfigSymbol, name),
		optional(Animations),
		BrowserWindowSymbol,
		ViewModeSym,
		StructureAPI,
		DynamicFeatureLoader,
		ExperimentsSymbol,
		TpaMessageContextPickerSym,
		optional(WindowScrollApiSymbol),
		optional(TpaModalSymbol),
		optional(TpaPopupSymbol),
		optional(LightboxSymbol),
		optional(ReporterSymbol),
		optional(MultilingualSymbol),
	],
	(
		{ templateIdToCompIdMap }: WindowWixCodeSdkPageConfig,
		animations: IAnimations,
		window: BrowserWindow,
		viewMode: ViewMode,
		structureApi: IStructureAPI,
		dynamicFeatureLoader: IPageFeatureLoader,
		experiments: Experiments,
		tpaContextPicker: TpaContextPicker,
		windowScrollApi?: IWindowScrollAPI,
		tpaModal?: ITpaModal,
		tpaPopup?: ITpaPopup,
		popupsFeature?: ILightbox,
		analyticFeature?: IReporterApi,
		multilingual?: IMultilingual
	): SdkHandlersProvider<WindowWixCodeSdkHandlers> => {
		const getCompIdFromTemplateId = (templateId: string): string => templateIdToCompIdMap[templateId] || templateId

		return {
			getSdkHandlers: () => ({
				getBoundingRectHandler: () => {
					if (!window) {
						return null
					}

					return Promise.resolve({
						window: {
							height: window.innerHeight,
							width: window.innerWidth,
						},
						document: {
							height: document.documentElement.scrollHeight,
							width: document.documentElement.clientWidth,
						},
						scroll: {
							x: window.scrollX,
							y: window.scrollY,
						},
					})
				},
				setCurrentLanguage: multilingual?.setCurrentLanguage || setCurrentLanguage,
				async scrollToComponent(compId: string, callback: Function) {
					if (!process.env.browser) {
						return // historically we don't invoke the callback in ssr, we can experiment with removing this if
					}
					await windowScrollApi?.scrollToComponent(compId)
					callback()
				},
				async scrollToHandler(x, y, shouldAnimate): Promise<undefined | ScrollAnimationResult> {
					if (isSSR(window)) {
						return
					}
					if (!shouldAnimate) {
						window.scrollTo(x, y)
					}
					return windowScrollApi?.animatedScrollTo(y)
				},
				async scrollByHandler(x, y) {
					if (isSSR(window)) {
						return
					}
					window.scrollBy(x, y)
					return new Promise((resolve) => {
						window.requestAnimationFrame(() => {
							resolve()
						})
					})
				},
				async copyToClipboard(text: string) {
					const copy = await import('copy-to-clipboard')
					copy.default(text)
				},

				getCurrentGeolocation() {
					if (isSSR(window)) {
						return Promise.resolve()
					}
					if (!hasNavigator(window)) {
						return Promise.reject(new Error('Geolocation not available'))
					}

					return new Promise((resolve, reject) => {
						navigator.geolocation.getCurrentPosition(
							({ timestamp, coords }: GeolocationPosition) => {
								// Convert to a plain object, because GeolocationCoordinates cannot be
								// sent over postMessage.
								resolve({
									timestamp,
									coords: _.toPlainObject(coords),
								})
							},
							({ message, code }) => {
								reject({ message, code })
							}
						)
					})
				},
				async openModal(url: string, options: any, compId?: string) {
					// TODO: remove when specs.thunderbolt.dynamicLoadTpaFeature is merged
					if (!experiments['specs.thunderbolt.dynamicLoadTpaFeature'] && !tpaModal) {
						throw new Error('TPA Modal feature is not available')
					}
					const displayedId = compId && getCompIdFromTemplateId(compId)
					// TODO: remove when specs.thunderbolt.dynamicLoadTpaFeature is merged
					if (tpaModal) {
						return tpaModal.openModal(url, options, displayedId)
					}
					const pageInfo = displayedId
						? tpaContextPicker.getMessageSourceContainerId({ compId: displayedId })
						: undefined
					const modal = await dynamicFeatureLoader.loadFeature<ITpaModal>('tpa', TpaModalSymbol, pageInfo)
					return modal.openModal(url, options, displayedId)
				},
				openLightbox(lightboxPageId, lightboxName, closeHandler) {
					return popupsFeature
						? popupsFeature.open(lightboxPageId, closeHandler)
						: Promise.reject(`There is no lightbox with the title "${lightboxName}".`)
				},
				closeLightbox() {
					if (popupsFeature) {
						popupsFeature.close()
					}
				},
				async openTpaPopup(url: string, options: any, compId: string) {
					// TODO: remove when specs.thunderbolt.dynamicLoadTpaFeature is merged
					if (!tpaPopup && !experiments['specs.thunderbolt.dynamicLoadTpaFeature']) {
						throw new Error('TPA Popup feature is not available')
					}
					const displayedId = getCompIdFromTemplateId(compId)
					// TODO: remove when specs.thunderbolt.dynamicLoadTpaFeature is merged
					if (tpaPopup) {
						return tpaPopup.openPopup(url, options, displayedId)
					}
					const pageInfo = tpaContextPicker.getMessageSourceContainerId({ compId: displayedId })
					const dynamicPopup = await dynamicFeatureLoader.loadFeature<ITpaPopup>(
						'tpa',
						TpaPopupSymbol,
						pageInfo
					)
					return dynamicPopup.openPopup(url, options, displayedId)
				},
				trackEvent(eventName: string, params = {}, options = {}) {
					const event = { eventName, params, options }
					analyticFeature && analyticFeature.trackEvent(event)
				},
				postMessageHandler(
					message: any,
					target: string = 'parent',
					targetOrigin: string = '*',
					transfer?: Array<Transferable>
				) {
					if (!window) {
						return
					}

					if (target !== 'parent') {
						return
					}

					window.parent.postMessage(message, targetOrigin, transfer)
				},
			}),
		}
	}
)
