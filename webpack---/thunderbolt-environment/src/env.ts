import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import * as logger from './logger/logger'
import * as bi from './bi/bi'
import * as experimentsLoader from './experiments'
import * as viewerModel from './viewer-model/viewer-model'
import * as fetchApiLoader from './client-fetch/client-fetch'
import * as componentsLibrariesLoader from './componentsLoader/componentsLibrariesLoader'
import * as waitForDomReadyLoader from './dom-ready/waitForDomReadyLoader'
import * as featureStateLoader from 'thunderbolt-feature-state'
import * as featureExportsLoader from 'thunderbolt-feature-exports'
import { Environment } from './types/Environment'
import {
	SiteAssetsClientSym,
	BrowserWindowSymbol,
	ReducedMotionSymbol,
	SsrLoggerSymbol,
	BaseComponentSymbol,
	PlatformWorkerPromiseSym,
	RendererExtensionsSymbol,
	AuthenticationSymbol,
	PerfReporterSymbol,
	MainGridAppIdFetchSymbol,
} from '@wix/thunderbolt-symbols'
import { WarmupDataPromiseSymbol } from 'feature-warmup-data'
import { prefersReducedMotion } from './lib/prefersReducedMotion'
import { ILoadFeatures, FeaturesLoaderSymbol } from '@wix/thunderbolt-features'

// TODO tmp put this here until able to use the one defined in thunderbolt-site-assets-client
const siteAssetsClientLoader = {
	site: ({ siteAssetsClient }: Environment): ContainerModuleLoader => (bind) => {
		bind(SiteAssetsClientSym).toConstantValue(siteAssetsClient)
	},
}

const browserWindowLoader = {
	site: ({ browserWindow }: Environment): ContainerModuleLoader => (bind) => {
		bind(BrowserWindowSymbol).toConstantValue(browserWindow)
	},
}

const reducedMotionLoader = {
	site: ({ browserWindow, viewerModel: { requestUrl } }: Environment): ContainerModuleLoader => (bind) => {
		const reducedMotion = prefersReducedMotion(browserWindow, requestUrl)
		bind(ReducedMotionSymbol).toConstantValue(reducedMotion)
	},
}

const warmupDataLoader = {
	site: ({ warmupData }: Environment): ContainerModuleLoader => (bind) => {
		bind(WarmupDataPromiseSymbol).toConstantValue(warmupData)
	},
}

const featuresLoadersLoader = {
	site: ({ specificEnvFeaturesLoaders }: Environment): ContainerModuleLoader => (bind) => {
		bind<ILoadFeatures>(FeaturesLoaderSymbol).toConstantValue(specificEnvFeaturesLoaders)
	},
}

const contextualSsrLoggerLoader = {
	site: ({ contextualSsrLogger }: Environment): ContainerModuleLoader => (bind) => {
		const isSsr = !process.env.browser
		if (isSsr) {
			bind(SsrLoggerSymbol).toConstantValue(contextualSsrLogger)
		}
	},
}

const baseComponentLoader = {
	site: ({ BaseComponent }: Environment): ContainerModuleLoader => (bind) => {
		bind(BaseComponentSymbol).toConstantValue(BaseComponent)
	},
}

const platformWorkerPromiseLoader = {
	site: ({ platformWorkerPromise }: Environment): ContainerModuleLoader => (bind) => {
		// TODO make all platform flows work with this loader
		if (platformWorkerPromise) {
			bind(PlatformWorkerPromiseSym).toConstantValue(platformWorkerPromise)
		}
	},
}

const extensionsLoader = {
	site: ({ extensions }: Environment): ContainerModuleLoader => (bind) => {
		if (extensions) {
			bind(RendererExtensionsSymbol).toConstantValue(extensions)
		}
	},
}

const authenticationLoader = {
	site: (env: Environment): ContainerModuleLoader => (bind) => {
		if (env.authentication) {
			bind(AuthenticationSymbol).toConstantValue(env.authentication)
		}
	},
}

const perfReporterLoader = {
	site: ({ perfReporter }: Environment): ContainerModuleLoader => (bind) => {
		if (perfReporter) {
			bind(PerfReporterSymbol).toConstantValue(perfReporter)
		}
	},
}

const mainGridAppIdLoader = {
	site: ({ mainGridAppId }: Environment): ContainerModuleLoader => (bind) => {
		if (mainGridAppId) {
			bind(MainGridAppIdFetchSymbol).toConstantValue(mainGridAppId)
		}
	},
}

const loaders = [
	logger,
	bi,
	experimentsLoader,
	viewerModel,
	fetchApiLoader,
	componentsLibrariesLoader,
	featuresLoadersLoader,
	featureStateLoader,
	siteAssetsClientLoader,
	browserWindowLoader,
	warmupDataLoader,
	reducedMotionLoader,
	featureExportsLoader,
	contextualSsrLoggerLoader,
	waitForDomReadyLoader,
	baseComponentLoader,
	platformWorkerPromiseLoader,
	extensionsLoader,
	authenticationLoader,
	perfReporterLoader,
	mainGridAppIdLoader,
]

export const createEnvLoader = (env: Environment): ContainerModuleLoader => (bind) => {
	loaders.forEach((loaderCreator) => loaderCreator.site(env)(bind))
}
