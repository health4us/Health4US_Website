import { isRef, traverse, SMALL_FACTOR, EMPTY_SCHEMA } from './utils'
import { Schema } from './types'
import { DependencyIndex } from './DependencyIndex'

export class SchemaIndex {
	private schemas: Record<string, Record<string, Record<string, Schema>>> = {}

	constructor(private dependencyIndex: DependencyIndex) {}

	addSchemaToIndex(schema: Schema, ownRefPath: string) {
		traverse(
			schema,
			(val) => {
				if (isRef(val)) {
					this.dependencyIndex.addRefToIndex(val, ownRefPath)
					return true
				}
			},
			SMALL_FACTOR
		)
	}

	removeSchemaFromIndex(schema: Schema | typeof EMPTY_SCHEMA, ownRefPath: string) {
		if (schema !== EMPTY_SCHEMA) {
			traverse(schema, (val) => this.dependencyIndex.removeRefFromIndex(val, ownRefPath), SMALL_FACTOR)
		}
	}
}
