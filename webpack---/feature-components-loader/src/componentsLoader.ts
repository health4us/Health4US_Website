import React from 'react'

import { multi, optional, withDependencies } from '@wix/thunderbolt-ioc'
import {
	AppStructure,
	ComponentLibrariesSymbol,
	ILogger,
	LoggerSymbol,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import type {
	ComponentsLoaderRegistry,
	ComponentsRegistry,
	ComponentLibraries,
	CompControllersRegistry,
	IComponentsRegistrar,
	ComponentModule,
	IWrapComponent,
} from './types'
import { IComponentsLoader } from './IComponentLoader'
import { getCompClassType, taskify } from '@wix/thunderbolt-commons'
import { ComponentsRegistrarSymbol, ComponentWrapperSymbol } from './symbols'

import { createHydrateWrapper } from './suspenseManager'
import { createHydrateWrapper as createHydrateWrapperSSR } from './suspenseManagerSSR'

const { WithHydrateWrapper } = process.env.browser ? createHydrateWrapper() : createHydrateWrapperSSR()

type ComponentsLoaderFactory = (
	componentsLibraries: ComponentLibraries,
	componentsRegistrars: Array<IComponentsRegistrar>,
	logger: ILogger,
	viewerModel: ViewerModel,
	componentWrapper?: IWrapComponent
) => IComponentsLoader

const isComponentModule = <T>(loader: any): loader is ComponentModule<T> => !!loader.component

const componentsLoaderFactory: ComponentsLoaderFactory = (
	componentsLibraries,
	componentsRegistrars,
	logger,
	viewerModel,
	componentWrapper?
) => {
	const lazyManifestsResolvers: Array<() => Promise<void>> = []
	const componentsLoaderRegistry: ComponentsLoaderRegistry = {}
	const componentsRegistry: ComponentsRegistry = {}
	const compControllersRegistry: CompControllersRegistry = {}
	const hydrateOnViewport: Record<string, boolean> = {
		ClassicSection: true,
		Section: true,
		tpaWidgetNative: true,
		AppWidget: true,
		ByRefComponent: true,
	}

	const getComponentLoader = async (compType: string) => {
		const loader = componentsLoaderRegistry[compType]

		if (!loader && lazyManifestsResolvers.length) {
			await Promise.all(lazyManifestsResolvers.map((resolver) => resolver()))
			return componentsLoaderRegistry[compType]
		}

		return loader
	}

	const loadComponent = async (compType: string) => {
		if (componentsRegistry[compType]) {
			return
		}

		const loader = await getComponentLoader(compType)

		if (!loader) {
			return
		}

		process.env.browser && (await window.externalsRegistry.react.loaded) // components require React within their code so they have to be evaluated once React is defined.
		const module = await taskify(() => loader())
		const wrapComponent = componentWrapper?.wrapComponent || (React.memo as IWrapComponent['wrapComponent'])

		if (isComponentModule(module)) {
			module.component.displayName = compType
			componentsRegistry[compType] = wrapComponent(module.component)
			if (module.controller) {
				compControllersRegistry[compType] = module.controller
			}
		} else {
			componentsRegistry[compType] = wrapComponent(module.default)
		}

		if (
			viewerModel.react18Compatible &&
			process.env.PACKAGE_NAME !== 'thunderbolt-ds' &&
			React.version.startsWith('18') &&
			viewerModel.experiments['specs.thunderbolt.viewport_hydration_react_18'] &&
			hydrateOnViewport[compType]
		) {
			const comp = WithHydrateWrapper({ on: 'viewport', Comp: componentsRegistry[compType] })
			componentsRegistry[compType] = comp
		}
	}

	const getRequiredComps = (structure: AppStructure) => {
		const allCompClassTypes = Object.entries(structure).map(([_, { componentType, uiType }]) =>
			getCompClassType(componentType, uiType)
		)
		const uniqueCompTypes = [...new Set(allCompClassTypes)]
		return uniqueCompTypes
	}

	const registerLibraries = taskify(async () => {
		const assignComponents = (components: Record<string, any>) => {
			Object.assign(componentsLoaderRegistry, components)
		}

		logger.phaseStarted('componentsLibraries')
		const libs = [...componentsRegistrars, ...(await componentsLibraries)]
		logger.phaseEnded('componentsLibraries')

		logger.phaseStarted('componentLoaders')
		libs.forEach(({ getAllComponentsLoaders, getComponents }) => {
			assignComponents(getComponents())

			if (getAllComponentsLoaders) {
				lazyManifestsResolvers.push(async () => {
					assignComponents(await getAllComponentsLoaders())
				})
			}
		})
		logger.phaseEnded('componentLoaders')
	})

	return {
		getComponentsMap: () => componentsRegistry,
		getCompControllersMap: () => compControllersRegistry,
		loadComponents: async (structure) => {
			await registerLibraries

			const requiredComps = getRequiredComps(structure)
			return Promise.all(requiredComps.map((compType) => loadComponent(compType)))
		},
		loadAllComponents: async () => {
			await registerLibraries

			const requiredComps = Object.keys(componentsLoaderRegistry)
			return Promise.all(requiredComps.map((compType) => loadComponent(compType)))
		},
		loadComponent: async (componentType: string, uiType?: string) => {
			await registerLibraries
			return loadComponent(getCompClassType(componentType, uiType))
		},
	}
}

export const ComponentsLoader = withDependencies(
	[
		ComponentLibrariesSymbol,
		multi(ComponentsRegistrarSymbol),
		LoggerSymbol,
		ViewerModelSym,
		optional(ComponentWrapperSymbol),
	],
	componentsLoaderFactory
)
