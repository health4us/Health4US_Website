import { ProtectedPagesState } from './types'
import { IFeatureState } from 'thunderbolt-feature-state'
import { withDependencies, named } from '@wix/thunderbolt-ioc'
import { FeatureStateSymbol } from '@wix/thunderbolt-symbols'
import { name } from './symbols'

function protectedPagesApi(featureState: IFeatureState<ProtectedPagesState>) {
	return {
		getPageJsonFileName(pageId: string): string | null {
			return featureState.get()?.pagesMap[pageId] ?? null
		},
	}
}

export const ProtectedPagesApi = withDependencies([named(FeatureStateSymbol, name)], protectedPagesApi)
