import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	IStructureAPI,
	StructureAPI,
	Props,
	IPropsStore,
	DIALOG_COMPONENT_ID,
	ICyclicTabbing,
	MasterPageFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import { CyclicTabbingSymbol } from 'feature-cyclic-tabbing'
import type { CaptchaDialogProps, ICaptchaApi, CaptchaMasterPageConfig } from './types'
import { name } from './symbols'

/**
 * Exposing access to open and close the captcha dialog component in a site level
 */
export const Captcha = withDependencies(
	[StructureAPI, Props, CyclicTabbingSymbol, named(MasterPageFeatureConfigSymbol, name)],
	(
		structureApi: IStructureAPI,
		propsStore: IPropsStore,
		cyclicTabbing: ICyclicTabbing,
		captchaMasterPageConfig: CaptchaMasterPageConfig
	): ICaptchaApi => {
		const { translations } = captchaMasterPageConfig
		return {
			open(props: CaptchaDialogProps) {
				cyclicTabbing.enableCyclicTabbing(DIALOG_COMPONENT_ID)
				propsStore.update({ [DIALOG_COMPONENT_ID]: { translations, ...props } })
				structureApi.addComponentToDynamicStructure(DIALOG_COMPONENT_ID, {
					componentType: 'CaptchaDialog',
					components: [],
				})
			},
			close() {
				cyclicTabbing.disableCyclicTabbing(DIALOG_COMPONENT_ID)
				structureApi.removeComponentFromDynamicStructure(DIALOG_COMPONENT_ID)
			},
		}
	}
)
