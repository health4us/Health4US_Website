import {
	Experiments,
	ExperimentsSymbol,
	IRendererPropsExtender,
	RendererPropsExtenderSym,
} from '@wix/thunderbolt-symbols'
import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { withDependencies } from '@wix/thunderbolt-ioc'
import { Environment } from '../types/Environment'

const rendererPropsExtender = withDependencies(
	[ExperimentsSymbol],
	(experiments: Experiments): IRendererPropsExtender => {
		return {
			async extendRendererProps() {
				return { experiments }
			},
		}
	}
)

export const site = ({ experiments }: Environment): ContainerModuleLoader => (bind) => {
	bind(ExperimentsSymbol).toConstantValue(experiments)
	bind(RendererPropsExtenderSym).to(rendererPropsExtender)
}
