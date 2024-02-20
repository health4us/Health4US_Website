import BaseEmitter from 'tiny-emitter'
import { ControllerEventsAPI } from '@wix/thunderbolt-symbols'
import { CONTROLLER_EVENTS } from './moduleNames'

export type IControllerEvents = {
	createScopedControllerEvents: (controllerId: string, repeaterId?: string, itemId?: string) => ControllerEventsAPI
	disposeRepeatedControllerEvents: (repeaterId: string, itemId: string) => void
}

const REPEATER_ITEM_DELIMITER = '_REP_'

const ControllerEvents = (): IControllerEvents => {
	// @ts-ignore
	const emitter = new BaseEmitter()
	const repeatedControllerDisposeCallbacks: { [controllerScopedId: string]: Array<() => void> } = {}
	const createRepeaterItemSuffix = (repeaterId: string, itemId: string) => `${REPEATER_ITEM_DELIMITER}${repeaterId}_${itemId}`
	const createControllerScopedData = (controllerId: string, repeaterId?: string, itemId?: string) => {
		const repeaterItemSuffix = repeaterId ? createRepeaterItemSuffix(repeaterId, itemId!) : ''
		return {
			controllerScopedId: `${controllerId}${repeaterItemSuffix}`,
			repeaterItemSuffix,
		}
	}

	return {
		createScopedControllerEvents: (controllerId: string, repeaterId?: string, itemId?: string): ControllerEventsAPI => {
			const { controllerScopedId, repeaterItemSuffix } = createControllerScopedData(controllerId, repeaterId, itemId)
			const scopeEvent = (event: string) => `${controllerScopedId}_${event}`

			return {
				on(event: string, callback: Function, context: any) {
					const scopedEvent = scopeEvent(event)
					emitter.on(scopedEvent, callback, context)
					const dispose = () => emitter.off(scopedEvent, callback)

					if (repeaterItemSuffix) {
						repeatedControllerDisposeCallbacks[repeaterItemSuffix] = repeatedControllerDisposeCallbacks[repeaterItemSuffix] || []
						repeatedControllerDisposeCallbacks[repeaterItemSuffix].push(dispose)
					}

					return dispose
				},

				once(event: string, callback: Function, context: any) {
					const scopedEvent = scopeEvent(event)
					emitter.once(scopedEvent, callback, context)
					return () => emitter.off(scopedEvent, callback)
				},

				off(event: string, callback: Function) {
					emitter.off(scopeEvent(event), callback)
				},

				fireEvent(event: string, ...args: any) {
					emitter.emit(scopeEvent(event), ...args)
				},
			}
		},
		disposeRepeatedControllerEvents: (repeaterId: string, itemId: string) => {
			const repeaterItemSuffix = createRepeaterItemSuffix(repeaterId, itemId)
			repeatedControllerDisposeCallbacks[repeaterItemSuffix]?.forEach((dispose) => dispose())
			delete repeatedControllerDisposeCallbacks[repeaterItemSuffix]
		},
	}
}

export default {
	factory: ControllerEvents,
	deps: [],
	name: CONTROLLER_EVENTS,
}
