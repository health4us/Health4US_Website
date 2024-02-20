class ElementorySupportError extends Error {
	readonly errorType: string

	constructor(errorType: string, message: string) {
		super(message)
		this.errorType = errorType
	}
}

export { ElementorySupportError }
