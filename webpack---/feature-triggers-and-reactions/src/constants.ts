import { StateReactionData } from '@wix/thunderbolt-becky-types'
import { TriggerType } from './types'

export const TriggerTypeEventNameMapper: { [index: string]: string } = {
	click: 'onClick',
	tap: 'onClick',
	'mouse-in': 'onMouseEnter',
	'mouse-out': 'onMouseLeave',
}

export const ReverseStateReactionTypeMapper: { [index: string]: StateReactionData['type'] } = {
	AddState: 'RemoveState',
	RemoveState: 'AddState',
}

export const DYNAMIC_COMP_CHILD_TRIGGER_TYPE_TO_COMP_ID_PROPERTY: Partial<
	Record<TriggerType, 'triggerComponentId' | 'targetCompId'>
> = {
	'viewport-enter': 'triggerComponentId',
	'viewport-leave': 'triggerComponentId',
	'page-visible': 'targetCompId',
}
