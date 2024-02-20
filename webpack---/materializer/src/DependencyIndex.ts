import { isRef, pathToStringPath } from './utils'
import { MarkType, visit } from './visit'
import { Ref } from './types'

const getAllInvalidations = (invalidations: Set<string>, deps: Map<string, Set<string>>) => {
	const marks: Map<string, MarkType> = new Map()
	const allInvalidations: Set<string> = new Set<string>()

	const callback = (node: string) => {
		allInvalidations.add(node)
	}

	for (const node of invalidations) {
		visit(node, marks, deps, callback)
	}

	return allInvalidations
}

export const toposort = (nodes: Set<string>, deps: Map<string, Set<string>>) => {
	const marks: Map<string, MarkType> = new Map()
	const output: Array<string> = new Array<string>(nodes.size)
	let i = nodes.size

	const callback = (node: string) => {
		--i
		output[i] = node
	}

	for (const node of nodes) {
		visit(node, marks, deps, callback)
	}

	return output
}

export class DependencyIndex {
	private index: Map<string, Set<string>> = new Map()

	addRefToIndex(ref: Ref<any>, ownRefPath: string) {
		const refPath = pathToStringPath(ref.refPath)
		if (!this.index.has(refPath)) {
			this.index.set(refPath, new Set<string>())
		}
		this.index.get(refPath)!.add(ownRefPath)
	}

	removeRefFromIndex(ref: unknown, ownRefPath: string) {
		if (isRef(ref)) {
			const refPath = pathToStringPath(ref.refPath)
			this.index.get(refPath)?.delete(ownRefPath)

			return true
		}
	}

	toposort(nodes: Set<string>) {
		return toposort(nodes, this.index)
	}

	getAllInvalidations(invalidations: Set<string>) {
		return getAllInvalidations(invalidations, this.index)
	}
}
