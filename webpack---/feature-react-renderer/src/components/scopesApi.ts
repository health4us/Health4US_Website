import _ from 'lodash'
import {
	getDisplayedId,
	getFullId,
	getInnerMostItemId,
	getRefCompIdsFromInflatedId,
	getTemplateFromInflatedId,
	REPEATER_DELIMITER,
} from '@wix/thunderbolt-commons'

export type ScopeData = { scope: Array<string | undefined>; repeaterItemsIndexes: Array<number | undefined> }

export const emptyScope = { scope: [], repeaterItemsIndexes: [] }

export const getChildScope = (
	parentId: string,
	parentScope: ScopeData,
	childScopeData?: { scopeId: string; parentType: string; itemIndex?: number }
) => {
	if (!childScopeData) {
		return parentScope
	}
	switch (childScopeData.parentType) {
		case 'Repeater':
			const repeaterScopedItem = getInnerMostItemId(childScopeData.scopeId!)
			const repeaterChildScope = [
				...parentScope.scope,
				getDisplayedId(getTemplateFromInflatedId(parentId)!, repeaterScopedItem),
			]
			const childRepeaterItemIndexes = [...parentScope.repeaterItemsIndexes, childScopeData.itemIndex]
			return { scope: repeaterChildScope, repeaterItemsIndexes: childRepeaterItemIndexes }

		case 'RefComponent':
			const refCompScopeId = getTemplateFromInflatedId(getFullId(childScopeData.scopeId))
			const refCompChildScope = [...parentScope.scope, refCompScopeId]
			return { scope: refCompChildScope, repeaterItemsIndexes: parentScope.repeaterItemsIndexes }

		default:
			throw new Error('childScopeData.parentType is not supported')
	}
}

export const getScopesAttributes = (scopeData: ScopeData) => {
	const { scope, repeaterItemsIndexes } = scopeData
	const scopeAttributes: { 'data-scope'?: string; 'data-repeater-items-indexes'?: string } = {}
	if (scope.length > 0) {
		scopeAttributes['data-scope'] = scope.join(',')
	}
	if (repeaterItemsIndexes.length > 0) {
		scopeAttributes['data-repeater-items-indexes'] = repeaterItemsIndexes.join(',')
	}

	return scopeAttributes
}

// const slotId = 'ref1_r_comp2'
// const slotsPlaceHolder = 'ref1_r_ref2_r_compId__item1'
export const getSlotsScope = (parentScopeData: ScopeData, slotId: string) => {
	const parentScopeScopes = [...parentScopeData?.scope] // ['ref1', 'repeater__item1' ,'ref2']
	const lastRefCompScopeFromSlotId = getRefCompIdsFromInflatedId(slotId).pop() // 'ref1_r_comp2' -> 'ref1'
	const lastIndexOfRefScope = _.findIndex(parentScopeScopes, (scopeId) => scopeId === lastRefCompScopeFromSlotId)

	if (lastIndexOfRefScope === -1) {
		return { ...parentScopeData, scope: [] }
	}

	// ['ref1', 'repeater__item1' ,'ref2'] -> ['ref1', 'repeater__item1']
	parentScopeData?.scope.forEach((scope, index) => {
		if (index > lastIndexOfRefScope && !scope?.includes(REPEATER_DELIMITER)) {
			parentScopeScopes.splice(index, 1)
		}
	})

	return { ...parentScopeData, scope: parentScopeScopes }
}
