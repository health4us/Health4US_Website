import React, { Fragment, useEffect } from 'react'
import StructureComponent from './StructureComponent'
import Context from './AppContext'
import { AppProps, RendererProps } from '../types'
import { extendStoreWithSubscribe } from './extendStoreWithSubscribe'
import { IPropsStore, IStructureStore, IStylesStore } from '@wix/thunderbolt-symbols'
import ComponentsStylesOverrides from './ComponentsStylesOverrides'

function App({
	structure,
	props,
	styles,
	compsLifeCycle,
	compEventsRegistrar,
	comps,
	compControllers,
	logger,
	batchingStrategy,
	onDidMount = () => {},
	layoutDoneService,
	stateRefs,
	rootCompId,
	getCompBoundedUpdateProps,
	getCompBoundedUpdateStyles,
	BaseComponent,
	DeletedComponent,
	disabledComponents = {},
	experiments,
}: AppProps) {
	const contextValue: RendererProps = {
		structure: extendStoreWithSubscribe<IStructureStore>(structure, batchingStrategy, layoutDoneService),
		props: extendStoreWithSubscribe<IPropsStore>(props, batchingStrategy, layoutDoneService),
		stateRefs: extendStoreWithSubscribe<IPropsStore>(stateRefs, batchingStrategy, layoutDoneService),
		styles: extendStoreWithSubscribe<IStylesStore>(styles, batchingStrategy),
		compsLifeCycle,
		compEventsRegistrar,
		logger,
		comps,
		compControllers,
		getCompBoundedUpdateProps,
		getCompBoundedUpdateStyles,
		BaseComponent,
		DeletedComponent,
		disabledComponents,
		experiments,
	}

	useEffect(onDidMount, [onDidMount])

	return (
		<Fragment>
			<Context.Provider value={contextValue}>
				<ComponentsStylesOverrides />
				<StructureComponent
					key={rootCompId}
					id={rootCompId}
					scopeData={{ scope: [], repeaterItemsIndexes: [] }}
				/>
			</Context.Provider>
		</Fragment>
	)
}

export default App
