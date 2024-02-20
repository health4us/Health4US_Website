import { withDependencies } from '@wix/thunderbolt-ioc'
import type { TpaHandlerProvider } from '@wix/thunderbolt-symbols'
import type { ITpaPublicApiManager } from 'feature-tpa-commons'
import { TpaPublicApiManagerSymbol } from 'feature-tpa-commons'

/**
 * Retrieves a platform app's public API if there's at least one (any) platform controller on page
 * Returns null otherwise
 */
export const PublicApiTPAHandler = withDependencies(
	[TpaPublicApiManagerSymbol],
	(tpaPublicApiManager: ITpaPublicApiManager): TpaHandlerProvider => {
		return {
			getTpaHandlers() {
				return {
					waitForWixCodeWorkerToBeReady: async () => {
						await tpaPublicApiManager.waitForPublicApiReady()
						return {}
					},
				}
			},
		}
	}
)
