import {
	IStructureStore,
	Structure,
	IBaseStructureAPI,
	IStructureAPI,
	EditorFeatureConfigSymbol,
	IPropsStore,
	Props,
} from '@wix/thunderbolt-symbols'
import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { BaseStructureAPISym, name } from './symbols'
import { StructureApiEditorConfig } from './types'
import { getPageBackgroundId } from '@wix/thunderbolt-commons'

const dsStructureAPI = (
	structureStore: IStructureStore,
	propsStore: IPropsStore,
	baseStructureAPI: IBaseStructureAPI,
	structureApiEditorConfig: StructureApiEditorConfig
): IStructureAPI => {
	return {
		...baseStructureAPI,
		addPageAndRootToRenderedTree: (pageId: string, contextId: string) => {
			const sitePages = structureStore.get('SITE_PAGES')
			const wrapperId = baseStructureAPI.getPageWrapperComponentId(pageId, contextId)
			const pageBgId = getPageBackgroundId(pageId)
			const hasPageBackground = structureStore.get(pageBgId)
			const mainMF = structureStore.get('main_MF')
			const rootComponents = [
				'FONT_FACES',
				'SCROLL_TO_TOP',
				'site-root',
				'DYNAMIC_STRUCTURE_CONTAINER',
				'SCROLL_TO_BOTTOM',
				'FONTS',
				'BYOC_STYLES',
				'SITE_STYLES',
				'CUSTOM_CSS',
			]
			if (hasPageBackground) {
				rootComponents.splice(1, 0, 'BACKGROUND_GROUP')
			}

			if (structureApiEditorConfig.isPreview && structureStore.get('SKIP_TO_CONTENT_BTN')) {
				rootComponents.splice(2, 0, 'SKIP_TO_CONTENT_BTN')
			}
			structureStore.update({
				main_MF: {
					...mainMF,
					components: rootComponents,
				},
				SITE_PAGES: {
					...sitePages,
					components: [wrapperId],
				},
				[wrapperId]: { componentType: 'PageMountUnmount', components: [pageId] },
				...(hasPageBackground && {
					BACKGROUND_GROUP: {
						componentType: 'BackgroundGroup',
						components: [pageBgId],
					},
				}),
			})
			// Set the global class name that will scope the global CSS styles
			propsStore.update({ main_MF: { className: 'wix-global-css' } })
		},
		addShellStructure: async () => Promise.resolve(),
	}
}

export const DsStructureAPI = withDependencies(
	[Structure, Props, BaseStructureAPISym, named(EditorFeatureConfigSymbol, name)],
	dsStructureAPI
)
