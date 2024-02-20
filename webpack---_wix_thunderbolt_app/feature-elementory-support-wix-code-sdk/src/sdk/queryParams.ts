const createElementorySupportQueryParams = (gridAppId: string, wixCodeInstance: string, viewMode: string): string =>
	`?gridAppId=${gridAppId}&instance=${wixCodeInstance}&viewMode=${viewMode}`

export { createElementorySupportQueryParams }
