// @ts-nocheck
export const defineCustomElement = (contextWindow, elementName, elementClass) => {
	if (contextWindow.customElements.get(elementName) === undefined) {
		contextWindow.customElements.define(elementName, elementClass)
	}
}
