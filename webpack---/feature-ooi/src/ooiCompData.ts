import { withDependencies } from '@wix/thunderbolt-ioc'
import { OOIWidgetConfig } from '@wix/thunderbolt-symbols'
import type { IOOICompData } from 'feature-ooi-tpa-shared-config'

export const ooiCompData = withDependencies(
	[],
	(): IOOICompData => {
		let _ooiComponents: { [compId: string]: OOIWidgetConfig } = {}
		return {
			getCompDataByCompId(compId: string) {
				return {
					widgetId: _ooiComponents?.[compId]?.widgetId,
					appDefinitionId: _ooiComponents?.[compId]?.appDefinitionId,
				}
			},
			updateOoiComponents(ooiComponents: { [compId: string]: OOIWidgetConfig }) {
				_ooiComponents = { ..._ooiComponents, ...ooiComponents }
			},
		}
	}
)
