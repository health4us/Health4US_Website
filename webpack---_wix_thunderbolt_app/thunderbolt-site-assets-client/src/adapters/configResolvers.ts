import { FleetConfig } from '@wix/thunderbolt-ssr-api'
import { Experiments } from '@wix/thunderbolt-symbols'
import { SiteAssetsClientConfig } from '@wix/site-assets-client'

export const shouldRouteStagingRequest = (fleetConfig: FleetConfig) => {
	return ['Stage', 'DeployPreview', 'Canary'].includes(fleetConfig.type)
}

export const updateConfig = (experiments: Experiments, config: SiteAssetsClientConfig): SiteAssetsClientConfig => {
	// should be used for experimental config/topology overrides
	return config
}
