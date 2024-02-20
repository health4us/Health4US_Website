import wixLog from '@wix/wix-log'
import { BrowserWindow } from '@wix/thunderbolt-symbols'

export type CssOverrides = { [prop: string]: string }
export type CssOverridesWithPriorities = { [prop: string]: { value: string; priority?: string } }

const logger = wixLog('thunderbolt-commons')

export const getRuntimeStyleOverridesManager = () => {
	const stylePropertiesToRestore: { [selector: string]: CssOverrides } = {}

	const styleOverrides = {
		setItemCssOverrides: (
			cssOverridesWithPriorities: CssOverridesWithPriorities,
			selector: string,
			window: NonNullable<BrowserWindow>
		) => {
			if (!process.env.browser && process.env.NODE_ENV !== 'test') {
				logger.error('setItemCssOverrides was called in SSR - window is missing')
				return
			}
			const nodes = window.document.querySelectorAll<HTMLElement>(selector)
			nodes.forEach((node) => {
				stylePropertiesToRestore[selector] = stylePropertiesToRestore[selector] || {}
				Object.entries(cssOverridesWithPriorities).forEach(([prop, override]) => {
					if (typeof stylePropertiesToRestore[selector][prop] === 'undefined') {
						// first override of this prop - save the original value to restore it later
						stylePropertiesToRestore[selector][prop] = node.style.getPropertyValue(prop)
					}

					node.style.setProperty(prop, override.value, override.priority)
				})
			})
		},
		clearItemCssOverrides: (selector: string, window: NonNullable<BrowserWindow>) => {
			const itemOverridesOriginalValues = stylePropertiesToRestore[selector]
			if (!itemOverridesOriginalValues) {
				return
			}

			const nodes = window.document.querySelectorAll<HTMLElement>(selector)
			nodes.forEach((node) => {
				Object.entries(itemOverridesOriginalValues).forEach(([prop, originalValue]) => {
					node.style.setProperty(prop, originalValue)
				})

				if (node.getAttribute('style') === '') {
					node.removeAttribute('style')
				}
			})

			delete stylePropertiesToRestore[selector]
		},
		clearAllItemsCssOverrides: (window: NonNullable<BrowserWindow>) => {
			Object.keys(stylePropertiesToRestore).forEach((selector) => {
				styleOverrides.clearItemCssOverrides(selector, window)
			})
		},
	}

	return styleOverrides
}
