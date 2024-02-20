const runner = async () => {
	if (window.__browser_deprecation__) {
		return
	}

	await window.externalsRegistry.lodash.loaded
	// break long task with other scripts that are loaded before main (lodash, etc...)
	setTimeout(() => {
		require('./client')
	}, 0)
}

void runner()
