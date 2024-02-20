export function getCompClassType(componentType: string, uiType?: string) {
	return uiType ? `${componentType}_${uiType}` : componentType
}

const viewer_components_id_prefixes = [
	'MENU_AS_CONTAINER_TOGGLE',
	'MENU_AS_CONTAINER_EXPANDABLE_MENU',
	'BACK_TO_TOP_BUTTON',
	'SCROLL_TO_',
	'TPAMultiSection_',
	'TPASection_',
	'comp-',
	'TINY_MENU',
	'MENU_AS_CONTAINER',
	'SITE_HEADER',
	'SITE_FOOTER',
	'SITE_PAGES',
	'PAGES_CONTAINER',
	'BACKGROUND_GROUP',
	'POPUPS_ROOT',
]

const comp_type_attribute = 'data-comp-type'

export function getClosestCompIdByHtmlElement(htmlElement: HTMLElement): string {
	let closestElement
	for (const prefix of viewer_components_id_prefixes) {
		closestElement = htmlElement.closest(`[id^="${prefix}"]`)
		if (closestElement) {
			break
		}
	}
	return closestElement?.id || ''
}

export function extractClosestCompTypeFromHtmlElement(htmlElement: HTMLElement): string {
	const closestElement = htmlElement.closest(`[${comp_type_attribute}]`)
	return closestElement?.getAttribute(comp_type_attribute) || ''
}
