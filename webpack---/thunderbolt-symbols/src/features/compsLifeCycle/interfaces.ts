export interface ICompsLifeCycle {
	registerToCompLifeCycle: (
		compIds: Array<string>,
		callbackName: string,
		callback: (compId: string, displayedId: string, element: HTMLElement) => any
	) => () => void
	notifyCompDidMount: (compId: string, displayedId: string) => void
	waitForComponentToRender: (compId: string) => Promise<Array<HTMLElement>>
	componentDidUnmount: (compId: string, displayedId?: string) => void
}

export const CompsLifeCycleSym = Symbol.for('CompsLifeCycle')
