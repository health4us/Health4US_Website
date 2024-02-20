function getIsScrollContainer(element: HTMLElement) {
	const overflow = window.getComputedStyle(element).overflowY
	return overflow !== 'visible' && overflow !== 'clip'
}

export function getNearestScrollRoot(element: HTMLElement | null): Window | HTMLElement {
	if (element == null) {
		return window
	}

	const isScrollContainer = getIsScrollContainer(element)

	if (isScrollContainer) {
		return element
	}

	return getNearestScrollRoot(element.parentElement)
}
