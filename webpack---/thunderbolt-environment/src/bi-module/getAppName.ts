import type { ViewerModel } from '@wix/thunderbolt-symbols'
import { rendererTypeQueryParam } from '@wix/thunderbolt-commons'

export function getAppName(viewerModel: ViewerModel): string {
	if (viewerModel.requestUrl.includes('wix-viewer-model=')) {
		return viewerModel.requestUrl.includes(`${rendererTypeQueryParam}=react-native`)
			? 'thunderbolt-renderer-mobile'
			: 'thunderbolt-renderer'
	}
	return viewerModel.site.appNameForBiEvents
}
