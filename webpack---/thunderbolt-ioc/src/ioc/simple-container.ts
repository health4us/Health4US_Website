import { ModuleMetadataSymbol } from './symbols'
import _ from 'lodash'
import {
	ContainerModuleLoader,
	Dependencies,
	FactoryWithDependencies,
	Identifier,
	IocContainer,
	ProviderCreator,
	TargetName,
} from './types'

const yieldToMain = () => {
	if (process.env.browser && process.env.PACKAGE_NAME !== 'thunderbolt-ds') {
		return new Promise((resolve) => setTimeout(resolve, 0))
	}
}

type FactoryParams = {
	factory: FactoryWithDependencies | ProviderCreator
	deps: Array<Dependencies>
	provider?: boolean
	factoryId: string
}
type ContainerState = {
	instances: Record<Identifier | string, any>
	factories: Record<Identifier | string, Array<FactoryParams>>
	instanceCache: Record<string, any>
}

export function Container(parentContainerState?: ContainerState | undefined): IocContainer {
	const state: ContainerState = {
		instances: {},
		factories: {},
		instanceCache: {},
	}

	let taskDeadline = 0
	const MAX_TASK_DURATION = 40

	let container: IocContainer | undefined // eslint-disable-line prefer-const

	function getDependencyData(depObject: Dependencies) {
		const name = (_.get(depObject, 'identifier') || depObject) as symbol
		const targetName = _.get(depObject, 'name')
		const isMulti = !!_.get(depObject, 'multi')
		const isOptional = !!_.get(depObject, 'optional')
		return {
			isOptional,
			isMulti,
			name,
			targetName,
		}
	}

	function getInstances(name: Identifier, targetName: TargetName | undefined, containerState: ContainerState) {
		const instanceData = containerState.instances[name]

		if (!instanceData && !targetName) {
			return init(name, targetName, containerState)
		}
		if (targetName) {
			const moduleKey = targetName ? `${name.toString()}_${targetName.toString()}` : name
			const namedValue = containerState.instances[moduleKey]
			if (!namedValue) {
				return init(name, targetName, containerState)
			}
			return namedValue
		}
		return instanceData
	}

	function getInstancesAsync(name: Identifier, targetName: TargetName | undefined, containerState: ContainerState) {
		const instanceData = containerState.instances[name]

		if (!instanceData && !targetName) {
			return initAsync(name, targetName, containerState)
		}
		if (targetName) {
			const moduleKey = targetName ? `${name.toString()}_${targetName.toString()}` : name
			const namedValue = containerState.instances[moduleKey]
			if (!namedValue) {
				return initAsync(name, targetName, containerState)
			}
			return namedValue
		}
		return instanceData
	}

	function resolveInstances(name: Identifier, targetName: TargetName | undefined) {
		const instances = getInstances(name, targetName, state)
		if (instances) {
			return instances
		}
		if (parentContainerState) {
			const parentInstance = getInstances(name, targetName, parentContainerState)
			if (parentInstance) {
				return parentInstance
			}
		}
		return []
	}

	async function resolveInstancesAsync(name: Identifier, targetName: TargetName | undefined) {
		const instances = await getInstancesAsync(name, targetName, state)
		if (instances) {
			return instances
		}
		if (parentContainerState) {
			const parentInstance = await getInstancesAsync(name, targetName, parentContainerState)
			if (parentInstance) {
				return parentInstance
			}
		}
		return []
	}

	function resolveDependency(depObject: Dependencies, moduleName: Identifier) {
		const { name, isMulti, isOptional, targetName } = getDependencyData(depObject)
		const instances = resolveInstances(name, targetName)
		if (!isMulti && !isOptional && instances.length === 0) {
			throw new Error(`Unbound dependency ${name.toString()} in module ${moduleName.toString()}`)
		}
		if (!isMulti && instances.length > 1) {
			throw new Error('Cannot get multiple instances without requesting multi')
		}

		return isMulti ? instances : instances[0]
	}

	async function yieldToMainIfNeeded() {
		if (performance.now() >= taskDeadline) {
			await yieldToMain()
			taskDeadline = performance.now() + MAX_TASK_DURATION
		}
	}

	async function resolveDependencyAsync(depObject: Dependencies, moduleName: Identifier) {
		if (process.env.browser) {
			await yieldToMainIfNeeded()
		}
		const { name, isMulti, isOptional, targetName } = getDependencyData(depObject)
		const instances = await resolveInstancesAsync(name, targetName)
		if (!isMulti && !isOptional && instances.length === 0) {
			throw new Error(`Unbound dependency ${name.toString()} in module ${moduleName.toString()}`)
		}
		if (!isMulti && instances.length > 1) {
			throw new Error('Cannot get multiple instances without requesting multi')
		}

		return { value: isMulti ? instances : instances[0] }
	}

	function executeFactory({
		factory,
		provider,
		deps,
		name,
	}: {
		factory: FactoryWithDependencies | ProviderCreator
		provider: boolean | undefined
		deps: Array<Dependencies>
		name: Identifier
	}): unknown {
		return provider
			? (factory as ProviderCreator)(container as IocContainer)
			: (factory as FactoryWithDependencies)(...deps.map((d: Dependencies) => resolveDependency(d, name)))
	}

	async function executeFactoryAsync({
		factory,
		provider,
		deps,
		name,
	}: {
		factory: FactoryWithDependencies | ProviderCreator
		provider: boolean | undefined
		deps: Array<Dependencies>
		name: Identifier
	}): Promise<{ value: unknown }> {
		const depsArray: Array<{ value: Dependencies }> = []
		for (const d of deps) {
			depsArray.push(await resolveDependencyAsync(d, name))
		}
		const resolvedDeps = depsArray.map((item) => item.value)
		const instance = provider
			? (factory as ProviderCreator)(container as IocContainer)
			: (factory as FactoryWithDependencies)(...resolvedDeps)

		return { value: instance }
	}

	function init(name: Identifier, targetName: TargetName | undefined, containerState: ContainerState) {
		const moduleKey = targetName ? `${name.toString()}_${targetName.toString()}` : name
		const modules = containerState.factories[moduleKey]
		if (!modules) {
			return undefined
		}
		return modules.map((mod) => {
			const { factoryId, factory, deps, provider } = mod
			const instance =
				containerState.instanceCache[factoryId] || executeFactory({ provider, deps, name, factory })
			containerState.instanceCache[factoryId] = instance
			containerState.instances[moduleKey] = containerState.instances[moduleKey] || []
			containerState.instances[moduleKey].push(instance)
			return instance
		})
	}

	async function initAsync(name: Identifier, targetName: TargetName | undefined, containerState: ContainerState) {
		const moduleKey = targetName ? `${name.toString()}_${targetName.toString()}` : name
		const modules = containerState.factories[moduleKey]
		if (!modules) {
			return undefined
		}
		const instances = []
		for (const mod of modules) {
			const { deps, factory, provider, factoryId } = mod
			const { value: instance } = containerState.instanceCache[factoryId]
				? { value: containerState.instanceCache[factoryId] }
				: await executeFactoryAsync({
						provider,
						factory,
						deps,
						name,
				  })
			containerState.instanceCache[factoryId] = instance
			containerState.instances[moduleKey] = containerState.instances[moduleKey] || []
			containerState.instances[moduleKey].push(instance)
			instances.push(instance)
		}
		return instances
	}

	function registerProvider(name: Identifier, factory: ProviderCreator, factoryId: string) {
		state.factories[name] = state.factories[name] || []
		state.factories[name].push({ factory, deps: [], provider: true, factoryId })
	}

	function register(name: Identifier, factory: FactoryWithDependencies, factoryId: string) {
		const deps = factory[ModuleMetadataSymbol].dependencies
		state.factories[name] = state.factories[name] || []
		state.factories[name].push({ factory, deps, factoryId })
	}

	function registerWithTargetName(
		name: Identifier,
		factory: FactoryWithDependencies,
		targetName: TargetName,
		factoryId: string
	) {
		const deps = factory[ModuleMetadataSymbol].dependencies
		const key = `${name.toString()}_${targetName.toString()}`
		state.factories[key] = state.factories[key] || []
		state.factories[key].push({ factory, deps, factoryId })
	}

	function registerConstantValueWithTargetName(
		name: Identifier,
		value: any,
		targetName: TargetName,
		factoryId: string
	) {
		const key = `${name.toString()}_${targetName.toString()}`
		state.factories[key] = state.factories[key] || []
		state.factories[key].push({ factory: () => value, deps: [], factoryId })
	}

	function registerConstantValue(name: Identifier, value: any, factoryId: string) {
		state.factories[name] = state.factories[name] || []
		state.factories[name].push({ factory: () => value, deps: [], factoryId })
	}

	function unregister(name: Identifier) {
		delete state.factories[name]
		delete state.instances[name]
	}

	function bind(...moduleNames: Array<Identifier>) {
		return {
			to(factory: FactoryWithDependencies) {
				const factoryId = _.uniqueId()
				moduleNames.forEach((name) => register(name, factory, factoryId))
				return {
					whenTargetNamed(targetName: TargetName) {
						registerWithTargetName(
							moduleNames[0],
							factory,
							targetName,
							`${factoryId}_${targetName.toString()}`
						)
					},
				}
			},
			toProvider(factory: ProviderCreator) {
				const factoryId = _.uniqueId()
				registerProvider(moduleNames[0], factory, factoryId)
				return {
					whenTargetNamed(targetName: TargetName) {
						throw new Error(
							`calling whenTargetNamed ${targetName.toString()} with toProvider on module ${moduleNames[0].toString()} is not supported`
						)
					},
				}
			},
			toConstantValue(value: any) {
				const factoryId = _.uniqueId()
				registerConstantValue(moduleNames[0], value, factoryId)
				return {
					whenTargetNamed(targetName: TargetName) {
						registerConstantValueWithTargetName(
							moduleNames[0],
							value,
							targetName,
							`${factoryId}_${targetName.toString()}`
						)
					},
				}
			},
		}
	}

	function rebind(...moduleNames: Array<Identifier>) {
		moduleNames.forEach((name: Identifier) => unregister(name))
		return bind(...moduleNames)
	}

	function createChild() {
		return Container(state)
	}

	const api: IocContainer = {
		bind,
		rebind,
		getNamed(name: Identifier, targetName: string) {
			return resolveDependency({ identifier: name, name: targetName }, name)
		},
		getAllNamed(name: Identifier, targetName: string) {
			return resolveDependency({ identifier: name, name: targetName, multi: true }, name)
		},
		async getNamedAsync(name: Identifier, targetName: string) {
			return (await resolveDependencyAsync({ identifier: name, name: targetName }, name)).value
		},
		async getAllAsync(name: Identifier) {
			taskDeadline = process.env.browser ? performance.now() + MAX_TASK_DURATION : 0
			return (await resolveDependencyAsync({ identifier: name, multi: true }, name)).value
		},
		getAll(name: Identifier) {
			return resolveDependency({ identifier: name, multi: true }, name)
		},
		get(name: Identifier) {
			return resolveDependency({ identifier: name, optional: true }, name)
		},
		async getAsync(name: Identifier) {
			taskDeadline = process.env.browser ? performance.now() + MAX_TASK_DURATION : 0
			return (await resolveDependencyAsync({ identifier: name, optional: true }, name)).value
		},
		load(...moduleLoaders: Array<ContainerModuleLoader>) {
			moduleLoaders.forEach((loader) => {
				loader(bind)
			})
		},
		createChild,
	}
	container = api
	return api
}
