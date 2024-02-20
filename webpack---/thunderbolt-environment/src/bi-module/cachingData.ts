import { CookieAnalysis } from '@wix/thunderbolt-symbols'

export type TimingEntry = { name: string; description: string }

const extractServerTiming = (getTimingEntries: () => Array<TimingEntry>) => {
	let serverTiming: Array<any>
	try {
		serverTiming = getTimingEntries()
	} catch (e) {
		serverTiming = []
	}
	let microPop
	const matches: Array<string> = []
	serverTiming.forEach((st) => {
		switch (st.name) {
			case 'cache':
				matches[1] = st.description
				break
			case 'varnish':
				matches[2] = st.description
				break
			case 'dc':
				microPop = st.description
				break
			default:
				break
		}
	})
	return {
		microPop,
		matches,
	}
}

export const extractCachingData = (cookie: string, getTimingEntries: () => Array<TimingEntry>): CookieAnalysis => {
	let microPop,
		caching = 'none'
	let match: Array<string> | null = cookie.match(
		/ssr-caching="?cache[,#]\s*desc=([\w-]+)(?:[,#]\s*varnish=(\w+))?(?:[,#]\s*dc[,#]\s*desc=([\w-]+))?(?:"|;|$)/
	)
	if (!match && window.PerformanceServerTiming) {
		const results = extractServerTiming(getTimingEntries)
		microPop = results.microPop
		match = results.matches
	}
	if (match && match.length) {
		caching = `${match[1]},${match[2] || 'none'}`
		if (!microPop) {
			microPop = match[3]
		}
	}
	if (caching === 'none') {
		const timing = typeof performance !== 'undefined' ? performance.timing : null
		if (timing && timing.responseStart - timing.requestStart === 0) {
			caching = 'browser'
		}
	}
	return {
		caching,
		isCached: caching.includes('hit'),
		...(microPop ? { microPop } : {}),
	}
}
