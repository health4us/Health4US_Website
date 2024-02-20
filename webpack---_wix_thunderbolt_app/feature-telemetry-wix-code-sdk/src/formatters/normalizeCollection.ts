const consoleTraversalDepthExclusive = 5
const consoleTraversalDepthInclusive = 6

interface Cloneable {
	[key: string]: any
}

export function normalizeCollection(collection: any, seen: Array<any>, depth: number): any {
	if (depth > consoleTraversalDepthInclusive) {
		return collection instanceof Map ? '[Map]' : collection instanceof Set ? '[Set]' : '[Array]'
	}
	if (collection instanceof Map) {
		const clone: Array<any> = ['[Map]']
		collection.forEach((v, k) => clone.push([normalize(k, seen, depth), normalize(v, seen, depth)]))
		return clone
	}
	if (collection instanceof Set) {
		const clone: Array<any> = ['[Set]']
		collection.forEach((v) => clone.push(normalize(v, seen, depth)))
		return clone
	}

	// To handle both "arguments" and real arrays.
	return Array.prototype.map.call(collection, (v) => normalize(v, seen, depth))
}

function normalize(v: any, seen: Array<any>, depth: any): any {
	if (v === null || v === undefined) {
		return v
	}

	if (v instanceof Error || v instanceof Date || typeof v === 'symbol' || typeof v === 'function') {
		return v.toString()
	}

	if (Array.isArray(v) || v instanceof Map || v instanceof Set) {
		if (seen.includes(v)) {
			return '[Circular]'
		}
		seen.push(v)
		const arrClone = normalizeCollection(v, seen, depth + 1)
		seen.pop()
		return arrClone
	}

	if (typeof v.then === 'function') {
		return `Promise<>`
	}

	if (typeof v === 'object') {
		if (depth > consoleTraversalDepthExclusive) {
			return '[Object]'
		}
		if (v.type && typeof v.type === 'string' && v.type.indexOf('$w.') === 0) {
			return v.id ? `$w('#${v.id}')` : `$w('${v.type.substr(3)}')`
		}
		seen.push(v)
		const vClone = Object.keys(v).reduce((clone: Cloneable, key: string) => {
			const memberValue = v[key]
			if (seen.includes(memberValue)) {
				clone[key] = '[Circular]'
			} else {
				clone[key] = normalize(memberValue, seen, depth + 1)
			}
			return clone
		}, {})
		seen.pop()
		return vClone
	}

	return v
}
