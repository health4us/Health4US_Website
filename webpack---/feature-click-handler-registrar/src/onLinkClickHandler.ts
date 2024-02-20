import { multi, withDependencies } from '@wix/thunderbolt-ioc'
import { IOnLinkClickHandler } from './types'
import {
	Experiments,
	ExperimentsSymbol,
	ILinkClickHandler,
	NavigationClickHandlerSymbol,
	SiteLinkClickHandlerSymbol,
} from '@wix/thunderbolt-symbols'
import { yieldToMain } from '@wix/thunderbolt-commons'

type HTMLElementTarget = HTMLElement | null
const getAnchorTarget = (event: MouseEvent) => {
	let eTarget = event.target as HTMLElementTarget

	while (eTarget && (!eTarget.tagName || eTarget.tagName.toLowerCase() !== 'a')) {
		eTarget = eTarget.parentNode as HTMLElementTarget
	}
	return eTarget
}

const shouldNotHandleLink = (anchorTarget: HTMLElementTarget) => {
	if (!anchorTarget) {
		return false
	}
	const href = anchorTarget.getAttribute('href') || ''
	return anchorTarget.getAttribute('data-cancel-link') || (href.startsWith('#') && href !== '#')
}

const onLinkClickHandler = (
	experiments: Experiments,
	navigationHandler: ILinkClickHandler,
	siteLinkClickHandlers: Array<ILinkClickHandler>
): IOnLinkClickHandler => {
	const masterPageClickHandlers: Array<ILinkClickHandler> = []
	const pageClickHandlers: Array<ILinkClickHandler> = []
	return {
		onLinkClick: async (e: MouseEvent) => {
			let shouldResumeDefault = true
			if (e.metaKey || e.ctrlKey) {
				return
			}
			const anchorTarget = getAnchorTarget(e)

			if (!anchorTarget) {
				return
			}

			const href = anchorTarget.getAttribute('href') || ''
			if (shouldNotHandleLink(anchorTarget)) {
				return
			}

			const shouldRunSynchronously = href.startsWith('blob:')
			const isOnLinkClickHandlerAsync =
				experiments['specs.thunderbolt.onLinkClickHandlerAsync'] && !shouldRunSynchronously
			if (isOnLinkClickHandlerAsync) {
				e.preventDefault()
				await yieldToMain()
			}

			const fireHandlers = (handlers: Array<ILinkClickHandler>) => {
				for (const handler of handlers) {
					const didHandle = handler.handleClick(anchorTarget)
					if (didHandle) {
						shouldResumeDefault = false
						if (!isOnLinkClickHandlerAsync) {
							e.preventDefault()
						}
						e.stopPropagation()
						return
					}
				}
			}

			fireHandlers([...siteLinkClickHandlers, ...masterPageClickHandlers])
			fireHandlers([...pageClickHandlers, navigationHandler])

			if (isOnLinkClickHandlerAsync && shouldResumeDefault) {
				href && window.open(href, anchorTarget.getAttribute('target') || '_self')
			}
		},
		registerPageClickHandler: (handler: ILinkClickHandler, pageId: string) => {
			pageId === 'masterPage' ? masterPageClickHandlers.push(handler) : pageClickHandlers.push(handler)
		},
	}
}

export const OnLinkClickHandler = withDependencies(
	[ExperimentsSymbol, NavigationClickHandlerSymbol, multi(SiteLinkClickHandlerSymbol)] as const,
	onLinkClickHandler
)
