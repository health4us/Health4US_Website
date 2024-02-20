import { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import {
	LifeCycle,
	TpaMessageContextPickerSym,
	TpaSrcQueryParamProviderSymbol,
	WixCodeSdkHandlersProviderSym,
} from '@wix/thunderbolt-symbols'
import {
	MasterPageTpaPropsCacheSymbol,
	TpaContextMappingSymbol,
	TpaPublicApiManagerSymbol,
	TpaSectionSymbol,
	TpaSrcBuilderSymbol,
} from './symbols'
import { TpaContextMappingFactory } from './tpaContextMapping'
import { TpaSrcBuilder } from './tpaSrcBuilder'
import { TpaSection } from './tpaSection'
import {
	AppSectionTpaSrcQueryParamProvider,
	BaseTpaSrcQueryParamProvider,
	CommonConfigTpaSrcQueryParamProvider,
	CurrencyTpaSrcQueryParamProvider,
	InstanceTpaSrcQueryParamProvider,
	RouteTpaSrcQueryParamProvider,
} from './tpaSrcQueryParamProviders'
import { TpaPublicApiManager } from './tpaPublicApiManager'
import { TpaMessageContextPicker } from './tpaMessageContextPicker'
import { TpaPropsCacheFactory } from './tpaPropsCache'

export const bindSharedFeatureParts: ContainerModuleLoader = (bind) => {
	bind(MasterPageTpaPropsCacheSymbol).to(TpaPropsCacheFactory)
	bind(LifeCycle.AppDidMountHandler, TpaMessageContextPickerSym).to(TpaMessageContextPicker)
	bind(LifeCycle.AppWillLoadPageHandler, TpaPublicApiManagerSymbol, WixCodeSdkHandlersProviderSym).to(
		TpaPublicApiManager
	)
	bind(TpaContextMappingSymbol).to(TpaContextMappingFactory)
	bind(TpaSrcBuilderSymbol).to(TpaSrcBuilder)
	bind(TpaSectionSymbol).to(TpaSection)
	bind(TpaSrcQueryParamProviderSymbol).to(BaseTpaSrcQueryParamProvider)
	bind(TpaSrcQueryParamProviderSymbol).to(InstanceTpaSrcQueryParamProvider)
	bind(TpaSrcQueryParamProviderSymbol).to(CurrencyTpaSrcQueryParamProvider)
	bind(TpaSrcQueryParamProviderSymbol).to(CommonConfigTpaSrcQueryParamProvider)
	bind(TpaSrcQueryParamProviderSymbol).to(RouteTpaSrcQueryParamProvider)
	bind(TpaSrcQueryParamProviderSymbol).to(AppSectionTpaSrcQueryParamProvider)
}
