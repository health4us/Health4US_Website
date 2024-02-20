import _ from 'lodash'
import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { MasterPageFeatureConfigSymbol, TpaHandlerProvider } from '@wix/thunderbolt-symbols'
import { name } from '../symbols'
import type { TpaMasterPageConfig } from '../types'

export type MessageData = { appDefinitionId?: string; sectionId: string }

export const IsAppSectionInstalledHandler = withDependencies(
	[named(MasterPageFeatureConfigSymbol, name)],
	({ pagesData }: TpaMasterPageConfig): TpaHandlerProvider => ({
		getTpaHandlers: () => ({
			isAppSectionInstalled(
				_compId,
				{ sectionId, appDefinitionId }: MessageData,
				{ appDefinitionId: callerAppDefinitionId }
			): boolean {
				const appPagesByAppDefId = _.filter(pagesData, {
					appDefinitionId: appDefinitionId || callerAppDefinitionId,
				})

				return _.some(appPagesByAppDefId, { tpaPageId: sectionId })
			},
		}),
	})
)
