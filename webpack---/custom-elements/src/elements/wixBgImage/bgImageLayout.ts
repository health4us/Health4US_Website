// @ts-nocheck

import { getImageComputedProperties, setStyle, getScreenHeight } from '../../utils/customElementsCommonUtils'

function didImageChange(currentImageUrlCss = '', newUrl) {
	return !currentImageUrlCss.includes(newUrl) || !!currentImageUrlCss !== !!newUrl
}

const init = (contextWindow = window) => {
	function setBackground(domNode, imageTransformData) {
		const elementStyleAndUrl = {
			backgroundImage: `url("${imageTransformData.uri}")`,
			...imageTransformData.css.container,
		}
		const image = new contextWindow.Image()

		image.onload = setStyle.bind(null, domNode, elementStyleAndUrl)
		image.src = imageTransformData.uri
	}

	function measure(id, measures, domNodes, { containerId, bgEffectName }, services) {
		const bgImage = domNodes[id]
		const container = domNodes[containerId]
		const { width, height } = services.getMediaDimensionsByEffect(
			bgEffectName,
			container.offsetWidth,
			container.offsetHeight,
			getScreenHeight(services.getScreenHeightOverride?.())
		)

		measures.width = width
		measures.height = height
		measures.currentSrc = bgImage.style.backgroundImage
		measures.bgEffectName = bgImage.dataset.bgEffectName
	}

	function patch(id, measures, domNodes, imageInfo, envConsts, services) {
		const bgImage = domNodes[id]
		imageInfo.targetWidth = measures.width
		imageInfo.targetHeight = measures.height

		const allowWEBPTransform = services.isExperimentOpen?.('specs.thunderbolt.allowWEBPTransformation')

		const imageTransformData = getImageComputedProperties(imageInfo, envConsts, 'bg', allowWEBPTransform)

		if (didImageChange(measures.currentSrc, imageTransformData.uri)) {
			setBackground(bgImage, imageTransformData)
		} else {
			setStyle(bgImage, imageTransformData.css.container)
		}
	}

	return {
		measure,
		patch,
	}
}

export { init }
