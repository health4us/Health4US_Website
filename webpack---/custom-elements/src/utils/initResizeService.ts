// @ts-nocheck

export const initResizeService = () => {
	const resizeService = {
		observedElementToRelayoutTarget: new Map(),
		getLayoutTargets(elements) {
			const elementsNeedRelayout = new Set()
			elements.forEach((e) => elementsNeedRelayout.add(resizeService.observedElementToRelayoutTarget.get(e)))

			return elementsNeedRelayout
		},
		observe: (element) => {
			resizeService.observedElementToRelayoutTarget.set(element, element)
			resizeObserver.observe(element)
		},
		unobserve: (element) => {
			resizeService.observedElementToRelayoutTarget.delete(element)
			resizeObserver.unobserve(element)
		},
		observeChild: (childElement, rootElement) => {
			resizeService.observedElementToRelayoutTarget.set(childElement, rootElement)
			resizeObserver.observe(childElement)
		},
		unobserveChild: (childElement) => {
			resizeService.observedElementToRelayoutTarget.delete(childElement)
			resizeObserver.unobserve(childElement)
		},
	}

	const resizeObserver = new window.ResizeObserver((entries) => {
		const rootElements = resizeService.getLayoutTargets(entries.map((entry) => entry.target))

		rootElements.forEach((e) => e.reLayout())
	})

	return resizeService
}
