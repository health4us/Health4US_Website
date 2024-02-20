import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { LifeCycle } from '@wix/thunderbolt-symbols'
import { CorruptedTranslationsBI } from './translations'

export const page: ContainerModuleLoader = (bind) => {
	bind(LifeCycle.PageDidMountHandler).to(CorruptedTranslationsBI)
}
