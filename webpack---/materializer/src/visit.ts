export type MarkType = 'PERMANENT' | 'TEMPORARY'

const MARKS: Record<string, MarkType> = {
	PERMANENT: 'PERMANENT',
	TEMPORARY: 'TEMPORARY',
}

export const visit = (
	node: string,
	marks: Map<string, MarkType>,
	deps: Map<string, Set<string>>,
	callback: (node: string) => void
) => {
	const mark = marks.get(node)
	if (mark === MARKS.PERMANENT) {
		return
	}
	if (mark === MARKS.TEMPORARY) {
		throw new Error('Cyclic dependency')
	}
	marks.set(node, MARKS.TEMPORARY)
	if (deps.has(node)) {
		for (const dep of deps.get(node)!) {
			visit(dep, marks, deps, callback)
		}
	}
	marks.set(node, MARKS.PERMANENT)
	callback(node)
}
