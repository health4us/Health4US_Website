// break long task to smaller tasks, see here: https://web.dev/optimize-long-tasks/#use-asyncawait-to-create-yield-points
export const yieldToMain = () => {
	if (
		process.env.browser &&
		process.env.PACKAGE_NAME !== 'thunderbolt-ds' &&
		process.env.RENDERER_BUILD !== 'react-native'
	) {
		return new Promise((resolve) => setTimeout(resolve, 0))
	}
}

export const taskify = async <T>(task: () => T) => {
	await yieldToMain()
	return task()
}
