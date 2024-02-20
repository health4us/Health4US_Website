import { fetchEval } from './fetchEval'
import type { FactoryOrNull, ModuleLoaderFactory, ModuleFactory } from './types'
import { createPromise } from '../createPromise'

type ResolveDepsOptions = { url: string; moduleDependenciesIds: Array<string>; dependencies: Record<string, unknown> }
type ResolveDeps = (options: ResolveDepsOptions) => Array<unknown>

const isFactoryDefined = (factory: unknown): factory is ModuleFactory => typeof factory === 'function'

export const amdLoaderFactory: ModuleLoaderFactory = ({
	scriptsCache,
	fetch,
	defaultDependencies,
	withFetchRetry = true,
	keepFailedScriptsInCache = true,
	globalThis = {},
}) => {
	const fetchPromisesCache: Record<string, Promise<Response>> = {}
	const resolveDeps: ResolveDeps = ({ url, moduleDependenciesIds, dependencies }) => {
		if (dependencies.globals) {
			return [dependencies.globals]
		}
		return moduleDependenciesIds.map((id: string) => {
			if (!(id in dependencies)) {
				throw new Error(`Module "${url}" dependency "${id}" is missing from provided dependencies map`)
			}
			return dependencies[id]
		})
	}
	const createModuleInstance = (
		amdModuleFactory: FactoryOrNull,
		{ url, dependencies }: Omit<ResolveDepsOptions, 'moduleDependenciesIds'>
	) => {
		if (isFactoryDefined(amdModuleFactory)) {
			const deps = resolveDeps({
				url,
				dependencies,
				moduleDependenciesIds: amdModuleFactory.moduleDependenciesIds || [],
			})
			return amdModuleFactory(...deps)
		}
		// Module bundle wasn't resolved to a factory, but to null
		return null
	}

	return {
		prefetchScript(url: string) {
			fetchPromisesCache[url] = fetchPromisesCache[url] || fetch(url)
		},
		loadModule: async (url, dependencies = {}) => {
			const moduleDependencies = { ...defaultDependencies, ...dependencies }
			// When a module is requested during the fetch of the first,
			// we return a promise that would resolve to an instance for every caller
			const cached = scriptsCache[url]
			if (cached) {
				return createModuleInstance(await cached, { url, dependencies: moduleDependencies })
			}

			const { promise: currentLoadModulePromise, resolver } = createPromise<FactoryOrNull>()
			scriptsCache[url] = currentLoadModulePromise
			let originalDefineValue: any
			let moduleFactory: FactoryOrNull = null
			const defineAmdGlobals = () => {
				originalDefineValue = globalThis.define
				globalThis.define = (
					nameOrDependenciesIds: string | Array<string>,
					dependenciesIdsOrFactory: Array<string> | Function,
					factory: Function | undefined
				) => {
					const isNamedDefine = typeof nameOrDependenciesIds === 'string'
					// const moduleName = isNamedDefine ? args[0] : null
					const moduleDependenciesIds = ((isNamedDefine ? dependenciesIdsOrFactory : nameOrDependenciesIds) ||
						[]) as Array<string>
					const amdModuleFactory = (isNamedDefine ? factory : dependenciesIdsOrFactory) as ModuleFactory
					// save factory for caching
					moduleFactory = amdModuleFactory
					// save moduleDependenciesIds to use it when moduleFactory is cached.
					moduleFactory.moduleDependenciesIds = moduleDependenciesIds
				}
				globalThis.define.amd = true
			}

			const cleanupAmdGlobals = () => {
				globalThis.define = originalDefineValue
			}

			const fetchWithCache = (fetchUrl: string) => fetchPromisesCache[fetchUrl] || fetch(fetchUrl)

			const fetchModule = () =>
				fetchEval(url, fetchWithCache, {
					beforeEval: defineAmdGlobals,
					afterEval: cleanupAmdGlobals,
				})

			try {
				await fetchModule()
			} catch (e) {
				if (!withFetchRetry) {
					throw e
				}

				await fetchModule() // retry
			} finally {
				if (!keepFailedScriptsInCache && !moduleFactory) {
					// dont keep broken fetch / eval results in cache
					delete fetchPromisesCache[url]
					delete scriptsCache[url]
				}
				resolver(moduleFactory)
			}
			return createModuleInstance(await currentLoadModulePromise, { url, dependencies: moduleDependencies })
		},
	}
}
