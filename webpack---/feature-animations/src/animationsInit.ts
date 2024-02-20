import { FeatureStateSymbol, IPageWillMountHandler, ViewMode, ViewModeSym } from '@wix/thunderbolt-symbols'
import type { IFeatureState } from 'thunderbolt-feature-state'
import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { CreateAnimatorManagerSymbol, name } from './symbols'
import type { AnimationsPageState, IAnimations, AnimatorManager, ICreateAnimatorManager } from './types'
import { taskify, createPromise } from '@wix/thunderbolt-commons'

export const AnimationsInit = withDependencies(
	[named(FeatureStateSymbol, name), ViewModeSym, CreateAnimatorManagerSymbol],
	(
		featureState: IFeatureState<AnimationsPageState>,
		viewMode: ViewMode,
		createAnimatorManager: ICreateAnimatorManager
	): IPageWillMountHandler & IAnimations => {
		const managers = featureState.get()?.managers
		const { promise, resolver } = createPromise<{
			animatorManager: AnimatorManager
			effectManager: AnimatorManager
		}>()

		if (!managers) {
			featureState.update(() => ({
				managers: promise,
			}))
		}

		return {
			name: 'animationsInit',
			pageWillMount() {
				if (!managers) {
					const managersPromise = Promise.resolve().then(() =>
						taskify(() => ({
							animatorManager: createAnimatorManager(viewMode),
							effectManager: createAnimatorManager('motion'),
						}))
					)
					resolver(managersPromise)
				}
			},
			getInstance() {
				return featureState.get().managers.then(({ animatorManager }) => animatorManager)
			},
			getEffectsInstance() {
				return featureState.get().managers.then(({ effectManager }) => effectManager)
			},
		}
	}
)
