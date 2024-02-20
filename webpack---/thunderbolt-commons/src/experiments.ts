import { Experiments } from '@wix/thunderbolt-symbols'

function isExperimentRunning(experiments: Experiments, experiment: string) {
	const value = experiments[experiment]
	return typeof value === 'boolean' ? !!value : value === 'new' || value === 'true'
}

const isInQueryParam = (queryParam: string) => (params: URLSearchParams, experiment: string) => {
	const experimentsQueryParam = params.get(queryParam)
	if (!experimentsQueryParam) {
		return false
	}
	return experimentsQueryParam.includes(experiment)
}

const isInExperimentsQueryParam = isInQueryParam('experiments')

const isInExperimentsOffQueryParam = isInQueryParam('experimentsOff')
function getQueryParams(originalUrl: string) {
	try {
		return new URL(originalUrl).searchParams
	} catch (e) {
		const URLObject = require('url').URL
		return new URLObject(originalUrl).searchParams
	}
}
/**
 *
 * @param specName the name of the spec, e.g. "specs.thunderbolt.myCoolExperiment"
 * @param experiments experiments object, can come from siteModel or from viewerModel
 * @param originalUrl in case experiments object comes from siteModel, we need to pass the originalUrl as well, because sitemodel is returned from html-renderer, which ignores the "experiments" and "experimentsOff" query param
 * @returns true if the experiment is open (either running or in the "experiments" query param) and false otherwise
 */
export function isExperimentOpen(specName: string, experiments: Experiments, originalUrl?: string) {
	if (!originalUrl) {
		return isExperimentRunning(experiments, specName)
	}
	const queryParams = getQueryParams(originalUrl)
	return (
		!isInExperimentsOffQueryParam(queryParams, specName) &&
		(isInExperimentsQueryParam(queryParams, specName) || isExperimentRunning(experiments, specName))
	)
}
