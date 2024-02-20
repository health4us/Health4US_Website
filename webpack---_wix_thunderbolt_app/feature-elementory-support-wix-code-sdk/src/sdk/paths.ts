const sanitize = (params: string) => (params.startsWith('?') || params.startsWith('&') ? params.substring(1) : params)
const sanitizeRelativePath = (path: string) => (path.startsWith('//') ? path.substring(1) : path)

function getPathWithBaseUrl(
	baseUrl: string,
	path: string,
	queryParameters: string,
	useRelativePath: Boolean,
	relativePath: string
) {
	const base = useRelativePath ? sanitizeRelativePath(relativePath) : baseUrl
	if (!queryParameters) {
		return base + path
	}

	const params = sanitize(queryParameters)

	if (path.indexOf('?') === -1) {
		return `${base}${path}?${params}`
	}

	return `${base}${path}&${params}`
}

export { getPathWithBaseUrl }
