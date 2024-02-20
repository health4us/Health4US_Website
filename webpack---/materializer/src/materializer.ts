import { inferSchema } from './inferSchema'
import {
	isRef,
	traverse,
	SMALL_FACTOR,
	getByArray,
	setByArray,
	get3d,
	set3d,
	DEPTH,
	fromStringPath,
	toStringPath,
	EMPTY_SCHEMA,
} from './utils'
import { DataFragment, MaterializerFactory, Ref, RefProvider, Update, Schema, InvalidationList } from './types'
import { SchemaIndex } from './SchemaIndex'
import { DependencyIndex } from './DependencyIndex'

export const createMaterializer: MaterializerFactory = ({ transform } = {}) => {
	const template: Record<string, Record<string, Record<string, any>>> = {}
	const materialized: Record<string, Record<string, Record<string, any>>> = {}
	const schemas: Record<string, Record<string, Record<string, Schema>>> = {}
	const pendingInvalidations = new Set<string>()
	const dependencyIndex = new DependencyIndex()
	const schemaIndex = new SchemaIndex(dependencyIndex)
	let firstRun = true

	const updateTemplate = (key1: string, key2: string, key3: string, newTemplate: DataFragment | undefined) => {
		pendingInvalidations.add(toStringPath(key1, key2, key3))

		if (typeof newTemplate === 'undefined') {
			delete template[key1]?.[key2]?.[key3]
			return
		}

		set3d(template, key1, key2, key3, newTemplate)
	}

	const mergeSchema = (key1: string, key2: string, key3: string, newSchema: DataFragment | typeof EMPTY_SCHEMA) => {
		const baseStringPath = toStringPath(key1, key2, key3)

		const currSchema = get3d(schemas, key1, key2, key3)
		if (newSchema === EMPTY_SCHEMA || isRef(newSchema)) {
			set3d(schemas, key1, key2, key3, newSchema)
			schemaIndex.removeSchemaFromIndex(currSchema, baseStringPath)

			if (newSchema !== EMPTY_SCHEMA) {
				// @ts-ignore TODO Argument of type 'DataFragment' is not assignable to parameter of type 'Ref<any>'.
				dependencyIndex.addRefToIndex(newSchema, baseStringPath)
			}
			return
		}

		if (!currSchema || currSchema === EMPTY_SCHEMA) {
			set3d(schemas, key1, key2, key3, newSchema)
			schemaIndex.addSchemaToIndex(newSchema, baseStringPath)
			return
		}

		// remove all refs from currSchema
		traverse(currSchema, (val) => dependencyIndex.removeRefFromIndex(val, baseStringPath), SMALL_FACTOR)

		let schemaToWrite: Schema

		traverse(
			newSchema,
			(newRef, path) => {
				if (!isRef(newRef)) {
					return
				}

				schemaToWrite = schemaToWrite || currSchema || {}
				setByArray(schemaToWrite, path, newRef)
				dependencyIndex.addRefToIndex(newRef, baseStringPath)
				return true
			},
			SMALL_FACTOR
		)

		if (schemaToWrite || currSchema) {
			set3d(schemas, key1, key2, key3, schemaToWrite || {})
		}
	}

	const populate = (invalidations: Set<string>, runAndReport: <T>(fn: () => T, name: string) => T = (fn) => fn()) => {
		const allInvalidations: Set<string> = runAndReport(
			() => (firstRun ? invalidations : dependencyIndex.getAllInvalidations(invalidations)),
			'getAllInvalidations'
		)

		const paths = runAndReport(
			() => dependencyIndex.toposort(allInvalidations).map(fromStringPath),
			'toposort'
		) as InvalidationList

		runAndReport(() => {
			for (const path of paths) {
				const [key1, key2, key3] = path
				if (!template[key1]?.[key2]) {
					continue
				}

				const val = get3d(template, key1, key2, key3)

				const nodeSchema = get3d(schemas, key1, key2, key3)
				if (nodeSchema === EMPTY_SCHEMA) {
					set3d(materialized, key1, key2, key3, transform ? transform(val, path) : val)
					continue
				}
				let newVal = {}
				traverse(
					val,
					(objValue, objPath) => {
						const schema = getByArray(nodeSchema, objPath)
						if (!schema) {
							setByArray(newVal, objPath, objValue)
							return true
						}
						if (schema.hasOwnProperty('$type')) {
							const resolved = getByArray(materialized, schema.refPath) ?? schema.defaultValue
							if (objPath.length > 0) {
								setByArray(newVal, objPath, resolved)
							} else {
								newVal = resolved
							}
							return true
						}
						if (Array.isArray(objValue)) {
							setByArray(newVal, objPath, [])
							return
						}
					},
					SMALL_FACTOR
				)
				set3d(materialized, key1, key2, key3, transform ? transform(newVal, path) : newVal)
			}
		}, 'traverse path')

		firstRun = false
		return paths
	}

	const flush = (runAndReport: <T>(fn: () => T, name: string) => T = (fn) => fn()) => {
		const recursiveInvalidations = runAndReport(() => populate(pendingInvalidations, runAndReport), 'populate')

		runAndReport(() => pendingInvalidations.clear(), 'pendingInvalidations.clear()')

		return recursiveInvalidations
	}

	const updateWithoutFlush: Update<void> = (key1, key2, key3, data, schema = inferSchema(data)) => {
		if (typeof key3 === 'undefined') {
			if (!template[key1]?.[key2]) {
				return
			}

			for (const existingKey in template[key1][key2]) {
				mergeSchema(key1, key2, existingKey, EMPTY_SCHEMA)
				updateTemplate(key1, key2, existingKey, undefined)
			}

			delete schemas[key1]?.[key2]
			delete template[key1]?.[key2]
			delete materialized[key1]?.[key2]

			return
		}

		mergeSchema(key1, key2, key3, schema ?? EMPTY_SCHEMA)
		updateTemplate(key1, key2, key3, data)
	}

	return {
		update(key1, key2, key3, data, schema) {
			updateWithoutFlush(key1, key2, key3, data, schema)
			return flush()
		},
		batch(batchFunction, runAndReport = (fn) => fn()) {
			batchFunction(updateWithoutFlush)
			return runAndReport(() => flush(runAndReport), 'flush')
		},
		get: (path: string | Array<string | number>) =>
			getByArray(materialized, Array.isArray(path) ? path : path.split('.')),
	}
}

export const createRef = <T>(refPath: Array<string>, defaultValue?: any): Ref<T> => {
	if (refPath.length < DEPTH) {
		throw new Error(`Unsupported ref path, must be ${DEPTH} or more levels deep`)
	}
	return { $type: 'ref', refPath, defaultValue }
}

export function getBoundRefProvider(pathToBind: Array<string>): RefProvider {
	return <T>(innerPath: Array<string>, defaultValue?: any): Ref<T> =>
		createRef<T>([...pathToBind, ...innerPath], defaultValue)
}
