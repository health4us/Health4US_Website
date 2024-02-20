import { withDependencies } from '@wix/thunderbolt-ioc'
import {
	AppDidMountPromiseSymbol,
	ComponentsStylesOverridesSymbol,
	IAppWillRenderFirstPageHandler,
	IComponentsStylesOverrides,
	IPropsStore,
	IStructureStore,
	Props,
	Structure,
} from '@wix/thunderbolt-symbols'
import { IWarmupDataProvider, WarmupDataProviderSymbol } from 'feature-warmup-data'
import _ from 'lodash'
import { PartialUpdates, PlatformWarmupData, PlatformWarmupDataManagerAPI } from '../types'
import { yieldToMain } from '@wix/thunderbolt-commons'

export const PlatformWarmupDataManager = withDependencies(
	[WarmupDataProviderSymbol, AppDidMountPromiseSymbol, Props, Structure, ComponentsStylesOverridesSymbol],
	(
		warmupDataProvider: IWarmupDataProvider,
		appDidMountPromise: Promise<unknown>,
		propsStore: IPropsStore,
		structureStore: IStructureStore,
		componentsStylesOverrides: IComponentsStylesOverrides
	): PlatformWarmupDataManagerAPI & IAppWillRenderFirstPageHandler => {
		const props: PartialUpdates = {}
		const structure: PartialUpdates = {}
		const styles: PartialUpdates = {}
		let appDidMount = false

		// When the application mounts, update the stores with the latest props, structure and styles
		appDidMountPromise.then(async () => {
			await yieldToMain()
			// Update with the props that are not already in the store
			propsStore.update(_.pickBy(props, (compUpdates, id) => !_.isEqual(compUpdates, propsStore.get(id))))
			await yieldToMain()
			structureStore.update(_.pickBy(structure, (compUpdates, id) => !_.isEqual(compUpdates, structureStore.get(id))))
			componentsStylesOverrides.set(_.pickBy(styles, (compUpdates, id) => !_.isEqual(compUpdates, componentsStylesOverrides.getCompStyle(id))))
			appDidMount = true
		})

		const warmupData = warmupDataProvider.getWarmupData<PlatformWarmupData>('platform').then((platformWarmupData) => {
			if (!platformWarmupData) {
				return
			}

			return {
				props: _.merge({}, ...platformWarmupData.ssrPropsUpdates),
				structure: _.merge({}, ...platformWarmupData.ssrStructureUpdates),
				styles: _.merge({}, ...platformWarmupData.ssrStyleUpdates),
			}
		})

		const shouldUseManager = async () => Boolean((await warmupData) && !appDidMount)

		return {
			shouldUseManager,
			async updateProps(partialUpdate: PartialUpdates) {
				_.forEach(partialUpdate, (compProps, compId) => {
					props[compId] = { ...props[compId], ...compProps }
				})
			},
			async updateStructure(partialUpdate: PartialUpdates) {
				_.forEach(partialUpdate, (compStructure, compId) => {
					structure[compId] = { ...structure[compId], ...compStructure }
				})
			},
			async updateStyles(partialUpdate: PartialUpdates) {
				_.forEach(partialUpdate, (compStyles, compId) => {
					styles[compId] = { ...styles[compId], ...compStyles }
				})
			},
			async appWillRenderFirstPage() {
				// update stores with warmup data before hydrating
				const platformWarmupData = await warmupData
				if (platformWarmupData) {
					propsStore.update(platformWarmupData.props)
					structureStore.update(platformWarmupData.structure)
					componentsStylesOverrides.set(platformWarmupData.styles)
				}
			},
		}
	}
)
