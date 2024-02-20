import { RendererProps } from '../types'
import Context from './AppContext'
import React, { useContext, ComponentType, useCallback, useMemo } from 'react'
import { ErrorBoundary, DeadComp } from './ErrorBoundary'
import _ from 'lodash'
import { getDisplayedId, getDefaultCompId } from '@wix/thunderbolt-commons'
import { useProps, useStoresObserver } from './hooks'
import { getChildScope, getScopesAttributes, emptyScope, getSlotsScope } from './scopesApi'
import type { ScopeData } from './scopesApi'
import type { AppStructureWithFeatures } from '@wix/thunderbolt-symbols'

const isDs = process.env.PACKAGE_NAME === 'thunderbolt-ds'

// id is the actual DOM id and compId is the id of the comp in the structure
type StructureComponentProps = {
	id: string
	compId?: string
	scopeData: ScopeData
	displayedItemId?: string
}
const renderComp = (
	propsStore: RendererProps['props'],
	childId: string,
	scopeData: ScopeData,
	displayedItemId?: string
) => {
	const childProps = propsStore.get(childId)

	const defaultChildId = getDefaultCompId(childId)
	return (
		<StructureComponent
			displayedItemId={displayedItemId}
			compId={childId}
			scopeData={scopeData}
			id={defaultChildId}
			key={
				childProps?.key || (displayedItemId ? getDisplayedId(defaultChildId, displayedItemId!) : defaultChildId)
			}
		/>
	)
}
const StructureComponent: ComponentType<StructureComponentProps> = React.memo(
	({ id, compId = id, displayedItemId = '', scopeData = emptyScope }) => {
		const { structure: structureStore, comps, disabledComponents }: RendererProps = useContext(Context)
		const displayedId = displayedItemId ? getDisplayedId(compId, displayedItemId) : compId

		const structure = structureStore.get(compId)
		const displayedStructure = structureStore.get(displayedId)
		const compStructure = displayedStructure ? { ...structure, ...displayedStructure } : structure || {}
		const { componentType, uiType } = compStructure
		const isCompDisabled = !!disabledComponents[componentType]
		const compClassType = uiType ? `${componentType}_${uiType}` : componentType
		if (!(compClassType in comps)) {
			console.warn('Unknown component type', compClassType)
		}

		useStoresObserver(compId, displayedId)

		return (
			<StructureComponentInner
				id={id}
				key={`${id}_${compClassType}`}
				compId={compId}
				displayedItemId={displayedItemId}
				scopeData={scopeData}
				compStructure={compStructure}
				compClassType={compClassType}
				isCompDisabled={isCompDisabled}
			/>
		)
	}
)

type StructureComponentInnerProps = StructureComponentProps & {
	compStructure: AppStructureWithFeatures['components'][string]
	compClassType: string
	isCompDisabled: boolean
}

const StructureComponentInner: ComponentType<StructureComponentInnerProps> = ({
	id,
	compId = id,
	displayedItemId = '',
	scopeData = emptyScope,
	compStructure,
	compClassType,
	isCompDisabled,
}) => {
	const { props: propsStore, comps, logger, DeletedComponent, BaseComponent }: RendererProps = useContext(Context)
	let displayedId = displayedItemId ? getDisplayedId(compId, displayedItemId) : compId

	const Comp = comps[compClassType]
	const compProps = useProps(displayedId, compId, compClassType)
	const components = compStructure!.components
	const parentScope = scopeData
	const children = useCallback(
		(childScopeData?: { scopeId: string; parentType: string; itemIndex?: number }) =>
			(components || []).map((childId) => {
				const itemId = childScopeData?.parentType === 'Repeater' ? childScopeData!.scopeId : displayedItemId

				const childScope = isDs ? getChildScope(compId, parentScope, childScopeData) : emptyScope
				return renderComp(propsStore, childId, childScope, itemId)
			}),
		[components, displayedItemId, compId, parentScope, propsStore]
	)

	const slots = compStructure!.slots
	const slotsProps = useMemo(
		() =>
			_.mapValues(slots, (slotId) => {
				const slotsScope = getSlotsScope(parentScope, slotId)
				return renderComp(propsStore, slotId, slotsScope, displayedItemId)
			}),
		[slots, displayedItemId, propsStore, parentScope]
	)

	const scopeAttr = isDs ? getScopesAttributes(scopeData) : {}
	const shouldRenderComp = !isCompDisabled && Comp

	// TODO: Remove the fallback once all components are implemented
	// in case comp is not inside repeater, remove hover box suffix if exist
	displayedId = displayedItemId ? displayedId : getDefaultCompId(id)
	const component = compStructure.deleted ? (
		<DeletedComponent BaseComponent={BaseComponent} id={displayedId} />
	) : shouldRenderComp ? (
		<Comp
			className={compProps?.className ? `${compProps.className} ${compId}` : compId}
			{...compProps}
			{...scopeAttr}
			slots={slotsProps}
			id={displayedId}
		>
			{children}
		</Comp>
	) : (
		<DeadComp id={displayedId} />
	)

	return (
		<ErrorBoundary
			id={displayedId}
			deleted={compStructure.deleted}
			logger={logger}
			Component={Comp}
			compClassType={compClassType}
			sentryDsn={compProps?.sentryDsn}
		>
			{component}
		</ErrorBoundary>
	)
}

export default StructureComponent
