import type { AnimationsKit } from '@wix/animations-kit'
import type {
	AnimationsPageConfig,
	AnimatorManager,
	ScrollManager,
	PointerManager,
	ScrubSceneFactoryMap,
	Animation,
	ScrollSceneFactory,
	PointerSceneFactory,
} from './types'
import type { IPropsStore } from '@wix/thunderbolt-symbols'
import { Scroll } from 'fizban'
import { Pointer } from 'kuliso'
import { getNearestScrollRoot } from './utils'
import { getDisplayedId, getItemId, REPEATER_DELIMITER } from '@wix/thunderbolt-commons'
import { PointerMoveTriggerParams } from '@wix/thunderbolt-becky-types'

const CLEAR_PROPS = 'clip,clipPath,webkitClipPath,willChange,opacity,transform,transformOrigin,filter'
const clearParams = { props: CLEAR_PROPS, immediateRender: true }

const getElements = (ids: Array<string>): Array<HTMLElement> => {
	const elements = ids.map((id) => document.getElementById(id))
	return elements.filter((element) => element) as Array<HTMLElement>
}

const getElementsFromObj = (obj: Record<string, string>): Record<string, HTMLElement> =>
	Object.entries(obj).reduce((elements: Record<string, HTMLElement>, [key, id]) => {
		const element = document.getElementById(id)
		return element ? Object.assign(elements, { [key]: element }) : elements
	}, {})

export const getAnimatorManager = (
	animator: AnimationsKit,
	featureConfig?: AnimationsPageConfig,
	propsStore?: IPropsStore
): AnimatorManager => ({
	getAnimationProperties(animationName: string) {
		return animator.getProperties(animationName)
	},
	getAnimationApi(animationName: string) {
		return animator.getApiForAnimation(animationName)
	},
	kill(instance, seek) {
		animator.kill(instance, seek)
	},
	reverse(instance) {
		instance.reversed(!instance.reversed())
	},
	runAnimation({ name: animationName, targetId, duration = 0, delay = 0, animationSelectors = {}, params = {} }) {
		const targetIds = Array.isArray(targetId) ? targetId : [targetId]
		const elements = getElements(targetIds)
		const elementsForParams = getElementsFromObj(animationSelectors)
		return animator.animate(animationName, elements, duration, delay, { ...params, ...elementsForParams })
	},
	runTransition({ name: transitionName, srcId, targetId, duration = 0, delay = 0, params = {} }) {
		const srcIds = Array.isArray(srcId) ? srcId : [srcId]
		const targetIds = Array.isArray(targetId) ? targetId : [targetId]
		const srcElements = getElements(srcIds)
		const targetElements = getElements(targetIds)

		return animator.transition(transitionName, srcElements, targetElements, duration, delay, params)
	},
	runSequence(sequenceItems, params = {}) {
		const sequence = animator.sequence(params)

		sequenceItems.forEach((sequenceItem) =>
			sequenceItem.type === 'Animation'
				? sequence.add(this.runAnimation(sequenceItem.data))
				: sequence.add(this.runTransition(sequenceItem.data))
		)

		return sequence
	},
	animateTimeScale({ instance, duration, from, to, easing }, callbacks?) {
		animator.animateTimeScale(instance, duration, from, to, easing, callbacks)
	},
	runAnimationOnElements: animator.animate,
	createSequence: animator.sequence,
	createAnimationFromParams: animator.animate, // TODO: probably should replace runAnimationOnElements
	getScrubTargets(sourceId, targetId) {
		const parentRepeater = featureConfig && featureConfig.repeaterTemplateToParentMap[targetId]
		const { items = [] } = parentRepeater && propsStore ? propsStore.get(parentRepeater) : {}
		return items.length ? items.map((item: string) => getDisplayedId(targetId, item)) : [targetId]
	},
	createScrubAnimations(animations) {
		const scrubScenes: ScrubSceneFactoryMap = {}

		Object.entries(animations).forEach(([effectId, scrubAnimation]) => {
			const {
				targetId,
				startOffset,
				endOffset,
				namedEffect,
				centeredToTarget,
				transitionDuration,
				transitionDelay,
				transitionEasing,
			} = scrubAnimation

			if (!namedEffect) {
				return
			}

			const { type, ...effectParams } = namedEffect

			let startOffsetAddition: string | undefined, endOffsetAddition: string | undefined
			const getScrubOffsets = this.getAnimationApi(type).getScrubOffsets
			if (getScrubOffsets) {
				const offsetAdditions = getScrubOffsets(effectParams)
				startOffsetAddition = offsetAdditions.start
				endOffsetAddition = offsetAdditions.end
			}

			scrubScenes[effectId] = {
				targetId,
				factory: (targetId_, disabled = false) => {
					const animation = this.runAnimation({
						name: type,
						delay: 0,
						duration: 1,
						targetId: targetId_ || targetId,
						params: {
							...effectParams,
							startOffset,
							endOffset,
							transitionDuration,
							transitionDelay,
							transitionEasing,
							paused: true,
						},
					})
					scrubScenes[effectId].animation = animation as Animation

					const start = startOffset
						? {
								name: startOffset.name,
								offset: startOffset.offset!.value,
								add: startOffsetAddition,
						  }
						: undefined
					const end = endOffset
						? {
								name: endOffset.name,
								offset: endOffset.offset!.value,
								add: endOffsetAddition,
						  }
						: undefined

					let targetElement
					if (centeredToTarget) {
						targetElement = document.getElementById(targetId_ || targetId)
					}

					return {
						start,
						end,
						target: targetElement,
						centeredToTarget,
						disabled,
						effect: (__: any, p: number) => animation.progress(p),
						destroy: () => animation.kill?.(),
					}
				},
			}
		})
		return scrubScenes
	},
	startScrubAnimations(triggers, scrubScenes, forceEnableScene) {
		const scrollRootsMap = new Map()
		const scrollManagers: Array<ScrollManager> = []
		const pointerRootsMap = new Map()
		const pointerManagers: Array<PointerManager> = []

		function addScroll(factory: ScrollSceneFactory, source: HTMLElement, targetId: string) {
			const scene = factory(targetId)
			scene.viewSource = source
			const root = getNearestScrollRoot(scene.viewSource?.parentElement as HTMLElement | null)

			if (!scrollRootsMap.has(root)) {
				scrollRootsMap.set(root, [])
			}

			scrollRootsMap.get(root).push(scene)
		}

		function addPointer(
			factory: PointerSceneFactory,
			source: HTMLElement,
			targetId: string,
			effectId: string,
			triggerParams: PointerMoveTriggerParams
		) {
			const isHitAreaRoot = triggerParams.hitArea === 'root'
			const scene = factory(targetId, !forceEnableScene)
			const pointerScene = {
				isHitAreaRoot,
				effectId,
				...scene,
			}
			const triggerElement = isHitAreaRoot ? document.documentElement : source

			if (!pointerRootsMap.has(triggerElement)) {
				pointerRootsMap.set(triggerElement, [])
			}

			pointerRootsMap.get(triggerElement).push(pointerScene)
		}

		Object.entries(triggers).forEach(([effectId, trigger]) => {
			const isScroll = trigger.trigger === 'view-progress'
			const isPointer = trigger.trigger === 'pointer-move'

			if (isScroll || isPointer) {
				const { factory, targetId } = scrubScenes[effectId]
				const triggerElement = document.getElementById(trigger.componentId) as HTMLElement

				if (triggerElement) {
					const targetIds = this.getScrubTargets(trigger.componentId, targetId)
					targetIds.forEach((target) =>
						isScroll
							? addScroll(factory as ScrollSceneFactory, triggerElement, target)
							: addPointer(
									factory as PointerSceneFactory,
									triggerElement,
									target,
									effectId,
									trigger.params as PointerMoveTriggerParams
							  )
					)
				} else {
					//	probably the trigger element is a child of a Repeater
					const triggerElements = Array.from(
						document.querySelectorAll(`[id^="${trigger.componentId}${REPEATER_DELIMITER}"]`)
					)
					triggerElements.forEach((sourceElement: Element) => {
						// we only support animating inside same element of triggering Item with view-progress
						const target = getDisplayedId(targetId, getItemId(sourceElement.id))
						isScroll
							? addScroll(factory as ScrollSceneFactory, sourceElement as HTMLElement, target)
							: addPointer(
									factory as PointerSceneFactory,
									sourceElement as HTMLElement,
									target,
									effectId,
									trigger.params as PointerMoveTriggerParams
							  )
					})
				}
			}
		})

		scrollRootsMap.forEach((scenes, root) => {
			if (scenes.length) {
				const scrollManager = new Scroll({
					root,
					scenes,
					observeViewportEntry: false,
					observeViewportResize: false,
					observeSourcesResize: false,
				})
				scrollManager.start()

				scrollManagers.push(scrollManager)
			}
		})

		pointerRootsMap.forEach((scenes, root) => {
			const pointerManager = new Pointer({
				root: root === document.documentElement ? undefined : root,
				scenes,
			})
			pointerManager.start()

			pointerManagers.push(pointerManager)
		})

		return [...scrollManagers, ...pointerManagers]
	},
	killPreviewScrubAnimations(scrubManagers: Array<ScrollManager | PointerManager>) {
		if (scrubManagers.length) {
			scrubManagers.forEach((manager) => manager.destroy())
			scrubManagers.length = 0
		}
	},
	clearScrubAnimations(idsToClear: Set<string>) {
		const baseClearData = {
			name: 'BaseClear',
			targetId: [...idsToClear],
			duration: 0,
			delay: 0,
			params: clearParams,
		}

		this.runSequence([{ type: 'Animation', data: baseClearData }])

		return Promise.resolve()
	},
	updateViewMode: animator.updateViewMode,
})
