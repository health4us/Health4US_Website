import { withDependencies } from '@wix/thunderbolt-ioc'
import { CurrentRouteInfoSymbol } from '@wix/thunderbolt-symbols'
import type { RouterPublicDataResponse } from '../types'
import type { ICurrentRouteInfo } from 'feature-router'

export const GetRouterPublicDataHandler = withDependencies(
	[CurrentRouteInfoSymbol],
	(currentRouteInfo: ICurrentRouteInfo) => ({
		getTpaHandlers() {
			return {
				getRouterPublicData(): RouterPublicDataResponse {
					return (
						(currentRouteInfo.getCurrentRouteInfo()?.dynamicRouteData
							?.publicData as RouterPublicDataResponse) ?? {}
					)
				},
			}
		},
	})
)
