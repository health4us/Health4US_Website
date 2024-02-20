export interface IAppWillMountHandler {
	appWillMount: () => Promise<void> | void
}

export interface IAppWillLoadPageHandler {
	name: string
	appWillLoadPage: (pageInfo: { pageId: string; contextId: string }) => Promise<void> | void
}

export interface IAppWillRenderFirstPageHandler {
	appWillRenderFirstPage: (pageInfo: { pageId: string; contextId: string }) => Promise<void> | void
}

export interface IAppDidLoadPageHandler {
	appDidLoadPage: (pageInfo: { pageId: string; contextId: string }) => Promise<void> | void
}

export interface IPageWillMountHandler {
	name: string
	pageWillMount: (pageId: string) => Promise<void> | void
}

export interface IPageWillUnmountHandler {
	pageWillUnmount: (pageInfo: { pageId: string; contextId: string }) => Promise<void> | void
}

export interface DynamicLoadFeature {
	init: (pageId: string) => void
}

type IPageDidMountHandlerResult = IPageDidUnmountHandler['pageDidUnmount']
export interface IPageDidMountHandler {
	pageDidMount: (
		pageId: string
	) => IPageDidMountHandlerResult | Promise<IPageDidMountHandlerResult> | void | Promise<void>
}

export interface IPageDidUnmountHandler {
	pageDidUnmount: (pageId: string) => void
}

export interface IAppDidMountHandler {
	appDidMount: () => void
}

export interface IAppWillUnmountHandler {
	/**
	 * cleanup lifecycle - invoked before deleting thunderbolt container
	 * use for clearing side effects (e.g. event listeners)
	 * prevents memory leaks when creating and disposing multiple thunderbolt containers
	 * */
	appWillUnmount: () => Promise<void> | void
}

const AppWillMountHandlerSym = Symbol('AppWillMountHandler')
const AppWillLoadPageHandlerSym = Symbol('AppWillLoadPageHandler')
const AppWillRenderFirstPageHandlerSym = Symbol('AppWillRenderFirstPageHandler')
const AppDidLoadPageHandlerSym = Symbol('AppDidLoadPageHandler')
const PageWillMountHandlerSym = Symbol('PageWillMountHandler')
const PageDidMountHandlerSym = Symbol('PageDidMountHandler')
const PageWillUnmountHandlerSym = Symbol('PageWillUnmountHandler')
const PageDidUnmountHandlerSym = Symbol('PageDidUnmountHandler')
const AppDidMountHandlerSym = Symbol('AppDidMountHandler')
const AppWillUnmountHandlerSym = Symbol('AppWillUnmountHandler')

export const LifecycleKeys: Record<symbol, boolean> = {
	[AppWillMountHandlerSym]: true,
	[AppWillLoadPageHandlerSym]: true,
	[AppWillRenderFirstPageHandlerSym]: true,
	[AppDidLoadPageHandlerSym]: true,
	[PageWillMountHandlerSym]: true,
	[PageDidMountHandlerSym]: true,
	[PageWillUnmountHandlerSym]: true,
	[PageDidUnmountHandlerSym]: true,
	[AppDidMountHandlerSym]: true,
	[AppWillUnmountHandlerSym]: true,
}

export const LifeCycle = {
	AppWillMountHandler: AppWillMountHandlerSym,
	AppWillLoadPageHandler: AppWillLoadPageHandlerSym,
	AppWillRenderFirstPageHandler: AppWillRenderFirstPageHandlerSym,
	AppDidLoadPageHandler: AppDidLoadPageHandlerSym,
	PageWillMountHandler: PageWillMountHandlerSym,
	PageDidMountHandler: PageDidMountHandlerSym,
	PageWillUnmountHandler: PageWillUnmountHandlerSym,
	PageDidUnmountHandler: PageDidUnmountHandlerSym,
	AppDidMountHandler: AppDidMountHandlerSym,
	AppWillUnmountHandler: AppWillUnmountHandlerSym,
}
