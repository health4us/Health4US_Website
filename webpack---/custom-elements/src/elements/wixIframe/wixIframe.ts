// @ts-nocheck
function wixIframeWrapper(WixElement): any {
	class WixIframe extends WixElement {
		// eslint-disable-next-line @typescript-eslint/no-useless-constructor
		constructor() {
			// eslint-disable-line no-useless-constructor
			super()
		}

		reLayout() {
			// TODO - add lazy loading if bv_lazyTPAs experiment is merged
			// TODO - handle instance templating from clientSpecMap once we implement static html loading
			const iframe = this.querySelector('iframe')
			if (iframe) {
				const dataSrc = iframe.dataset.src
				if (dataSrc && iframe.src !== dataSrc) {
					iframe.src = dataSrc
					iframe.dataset.src = ''
					this.dataset.src = ''
				}
			}
		}

		attributeChangedCallback(name, oldValue, newValue) {
			if (newValue) {
				this.reLayout()
			}
		}

		static get observedAttributes() {
			return ['data-src']
		}
	}

	return WixIframe
}

export default wixIframeWrapper
