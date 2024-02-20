import { FallbackCorvidModel } from '@wix/editor-elements-corvid-utils/dist/esm'
import type { PlatformEnvData, IPlatformLogger, Experiments } from '@wix/thunderbolt-symbols'
import { IComponentSDKLoader, createComponentsRegistryPlatform } from './platform'
import { ComponentsRegistryError, ComponentsRegistryErrorTypes } from './errors'
import { isExperimentOpen } from '@wix/thunderbolt-commons'

export const getComponentsSDKLoader = async ({
	componentsRegistryEnvData,
	logger,
	experiments,
}: {
	componentsRegistryEnvData: PlatformEnvData['componentsRegistry']
	logger: IPlatformLogger
	experiments: Experiments
}): Promise<IComponentSDKLoader> => {
	const runtime = self.componentsRegistry ? self.componentsRegistry.runtime : null
	const libraries = runtime ? runtime.libraries : componentsRegistryEnvData.librariesTopology
	const mode = componentsRegistryEnvData.mode
	const isExperimentOpenFn = (specName: string) => isExperimentOpen(specName, experiments)

	try {
		const componentsRegistryPlatform = await createComponentsRegistryPlatform({
			libraries,
			mode,
			loadFallbackSDKModule: () => FallbackCorvidModel.loadSDK() as any,
			runAndReport: (metric, fn) => {
				return logger.runAsyncAndReport(metric, fn)
			},
			fetchFn: self.fetch,
			logger,
			isExperimentOpenFn,
		})

		return componentsRegistryPlatform.getComponentsSDKsLoader()
	} catch (e) {
		return {
			sdkTypeToComponentTypes: {},
			loadComponentSdks: () =>
				Promise.reject(
					new ComponentsRegistryError(e.message, e.name, ComponentsRegistryErrorTypes.COMPONENT_LOADING_ERROR)
				),
		}
	}
}
