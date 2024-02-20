import React from 'react'
import ReactDOM from 'react-dom'
import { withDependencies, optional, multi, named } from '@wix/thunderbolt-ioc'
import {
	IRenderer,
	BatchingStrategy,
	BatchingStrategySymbol,
	LayoutDoneServiceSymbol,
	ILayoutDoneService,
	ExperimentsSymbol,
	Experiments,
	BaseComponentSymbol,
	IBaseComponent,
	SiteFeatureConfigSymbol,
	ViewerModel,
	ViewerModelSym,
	ILogger,
	LoggerSymbol,
} from '@wix/thunderbolt-symbols'
import { createPromise } from '@wix/thunderbolt-commons'
import type {
	IRendererPropsProvider,
	RendererProps,
	IThunderboltRootComponentRenderer,
	IThunderboltCssComponentRenderer,
} from '../types'
import { RendererPropsProviderSym, ThunderboltRootComponentRendererSym, name, ComponentCssSym } from '../symbols'
import { ReactRendererSiteConfig } from '../types'
import { ExternalComponentUiLibProvidersSymbol } from 'feature-external-component'
import type { UiLibProviders } from 'feature-external-component'

const { resolver: appDidMountResolver, promise: waitForAppDidMount } = createPromise()

export const appDidMountPromise = waitForAppDidMount

export const AppRootRenderer = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		RendererPropsProviderSym,
		BatchingStrategySymbol,
		BaseComponentSymbol,
		optional(LayoutDoneServiceSymbol),
		optional(ExternalComponentUiLibProvidersSymbol),
	],
	(
		{ disabledComponents }: ReactRendererSiteConfig,
		rendererProps: IRendererPropsProvider,
		batchingStrategy: BatchingStrategy,
		BaseComponent: IBaseComponent,
		layoutDoneService: ILayoutDoneService,
		externalComponentUiLibProviders?: UiLibProviders
	): IThunderboltRootComponentRenderer => ({
		render: (rootCompId, key) => {
			const App = externalComponentUiLibProviders
				? externalComponentUiLibProviders.wrapProviders(require('../components/App').default)
				: require('../components/App').default // App creates a React Context on module state, so it has to be evaluated once React is defined.
			const props = rendererProps.getRendererProps()
			return (
				<App
					key={key}
					{...props}
					batchingStrategy={batchingStrategy}
					onDidMount={appDidMountResolver}
					{...(layoutDoneService ? { layoutDoneService } : {})}
					rootCompId={rootCompId}
					BaseComponent={BaseComponent}
					disabledComponents={disabledComponents}
				/>
			)
		},
	})
)

export const ReactClientRenderer = withDependencies(
	[
		multi(ThunderboltRootComponentRendererSym),
		RendererPropsProviderSym,
		ExperimentsSymbol,
		ViewerModelSym,
		LoggerSymbol,
		optional(ComponentCssSym),
	],
	(
		renderers: Array<IThunderboltRootComponentRenderer>,
		rendererProps: IRendererPropsProvider,
		experiments: Experiments,
		viewerModel: ViewerModel,
		logger: ILogger,
		componentCss?: IThunderboltCssComponentRenderer
	): IRenderer<RendererProps, Promise<void>> => ({
		getRendererProps: rendererProps.getRendererProps,
		init: async () => {
			await rendererProps.resolveRendererProps()
		},
		render: async ({
			rootCompId = 'main_MF',
			target = document.getElementById('SITE_CONTAINER') as HTMLElement,
			cssRootCompIds = ['masterPage'],
		}) => {
			if (experiments['specs.thunderbolt.skip_hydration']) {
				return
			}
			function defineAndReportReactError() {
				const { error } = console
				console.error = (...args) => {
					try {
						const isStringError =
							args[0] && args[0].includes && args[0].includes('Error: Minified React error')
						const isObjectError =
							args[0] && args[0].message && args[0].message.includes('Error: Minified React error')
						if (isStringError || isObjectError) {
							logger.meter(`react_render_error`, {
								customParams: {
									error: 'Error: Minified React error',
									type: 'Minified React error',
								},
							})
							logger.captureError(new Error(args[0]), {
								tags: { reactError: true, feature: 'react-render' },
								extra: { args },
							})
						}
					} catch (e) {
						error(e)
					}
					error(...args)
				}
			}

			await window.reactAndReactDOMLoaded
			const app = (
				<React.StrictMode>
					<React.Fragment>
						{cssRootCompIds.map((cssRootCompId) => componentCss?.render(cssRootCompId))}
						{renderers.map((renderer, key) => renderer.render(rootCompId, key))}
					</React.Fragment>
				</React.StrictMode>
			)
			if (target.firstChild) {
				const isReact18 = React.version.startsWith('18')
				if (isReact18) {
					const reactRenderWrapper = (fn: Function) => {
						if (experiments['specs.thunderbolt.split_react_render']) {
							// @ts-ignore
							React.startTransition(() => {
								fn()
							})
						} else {
							fn()
						}
					}

					defineAndReportReactError()
					reactRenderWrapper(() => {
						try {
							require('react-dom/client').hydrateRoot(target, app, {
								onRecoverableError: (error: Error) => {
									logger.meter(`react_render_error`, {
										customParams: {
											error: error.message,
											type: 'onRecoverableError',
										},
									})
									logger.captureError(error, {
										tags: { reactError: true, feature: 'react-render' },
									})
								},
							})
						} catch (e) {
							logger.meter(`react_render_error`, {
								customParams: {
									error: e.message,
									type: 'exception',
								},
							})
							logger.captureError(e, {
								tags: { reactError: true, feature: 'react-render' },
							})
						}
					})
				} else {
					ReactDOM.hydrate(app, target)
				}
			} else {
				const isReact18 = React.version.startsWith('18')
				// @ts-ignore
				isReact18 ? ReactDOM.createRoot(target).render(app) : ReactDOM.render(app, target)
			}
			await waitForAppDidMount
		},
	})
)
