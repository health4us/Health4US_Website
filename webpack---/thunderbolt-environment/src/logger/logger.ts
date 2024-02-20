import { ContainerModuleLoader, withDependencies } from '@wix/thunderbolt-ioc'
import { LoggerSymbol, ILogger, IRendererPropsExtender, RendererPropsExtenderSym } from '@wix/thunderbolt-symbols'
import type { Environment } from '../types/Environment'
import { WarmupDataEnricherSymbol } from 'feature-warmup-data'
import SsrEventDataManager from './ssrEventDataManager'

const rendererPropsExtender = withDependencies(
	[LoggerSymbol],
	(logger: ILogger): IRendererPropsExtender => {
		return {
			async extendRendererProps() {
				return { logger }
			},
		}
	}
)

export const site = ({ logger }: Environment): ContainerModuleLoader => (bind) => {
	bind(LoggerSymbol).toConstantValue(logger)
	bind(WarmupDataEnricherSymbol).to(SsrEventDataManager)
	bind(RendererPropsExtenderSym).to(rendererPropsExtender)
}
