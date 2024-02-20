import { isIOS } from './isIOS'

export const sendBeacon = (url: string): void => {
	let sent = false

	if (!isIOS()) {
		try {
			sent = navigator.sendBeacon(url)
		} catch (e) {}
	}
	if (!sent) {
		new Image().src = url
	}
}
