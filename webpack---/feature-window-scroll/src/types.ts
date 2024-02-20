import { AnimationCallbacks } from 'feature-animations'

type scrollToComponentOptions = {
	callbacks?: AnimationCallbacks
	skipScrollAnimation?: boolean
}

export type IWindowScrollAPI = {
	animatedScrollTo: (targetY: number, callbacks?: AnimationCallbacks) => Promise<ScrollAnimationResult>
	scrollToComponent: (targetCompId: string, options?: scrollToComponentOptions) => Promise<void>
}

export type IResolvableReadyForScrollPromise = {
	readyForScrollPromise: Promise<void>
	setReadyForScroll: () => void
}

export type WindowScrollPageConfig = {
	headerComponentId: string
	headerContainerComponentId: string
}

export enum ScrollAnimationResult {
	Completed,
	Aborted,
}
