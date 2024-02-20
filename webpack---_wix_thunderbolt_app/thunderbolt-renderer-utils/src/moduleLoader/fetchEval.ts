import type { Fetch } from './types'

export const fetchEval = async (
	url: string,
	fetch: Fetch,
	{ beforeEval, afterEval }: { beforeEval?: Function; afterEval?: Function } = {}
) => {
	const res = await fetch(url)
	if (!res.ok) {
		throw new Error(`Fetching asset failed with status code [${res.status}] ${url}`)
	}
	const code = await res.text()

	// this part must remain sync as it might interrupt other flows that are patching self.define
	beforeEval?.()
	try {
		eval.call(null, `${code}\n//# sourceURL=${url}`) // eslint-disable-line no-eval
	} catch (e) {
		console.error('failed evaluating asset', url, e)
		throw e
	} finally {
		afterEval?.()
	}
}
