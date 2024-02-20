import { withDependencies, optional } from '@wix/thunderbolt-ioc'
import {
	CurrentRouteInfoSymbol,
	IPageResourceFetcher,
	SiteAssetsClientSym,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import { SiteAssetsClientAdapter } from 'thunderbolt-site-assets-client'
import { errorPagesIds } from '@wix/thunderbolt-commons'
import { ICurrentRouteInfo } from 'feature-router'
import { IProtectedPagesApi, ProtectedPagesApiSymbol } from 'feature-protected-pages'

export const resourceFetcher: (
	viewerModel: ViewerModel,
	siteAssetsClient: SiteAssetsClientAdapter,
	currentRouteInfo: ICurrentRouteInfo,
	protectedPagesApiProvider?: IProtectedPagesApi
) => IPageResourceFetcher = (viewerModel, siteAssetsClient, currentRouteInfo, protectedPagesApiProvider) => ({
	fetchResource(pageCompId, resourceType) {
		const {
			siteAssets: { modulesParams, siteScopeParams },
			mode: { siteAssetsFallback },
		} = viewerModel

		const moduleParams = modulesParams[resourceType]
		const isErrorPage = !!errorPagesIds[pageCompId]

		const pageJsonFileNames = siteScopeParams.pageJsonFileNames
		const pageJsonFileName =
			pageJsonFileNames[pageCompId] ||
			protectedPagesApiProvider?.getPageJsonFileName(pageCompId) ||
			currentRouteInfo.getCurrentRouteInfo()?.pageJsonFileName
		const bypassSsrInternalCache = viewerModel.experiments.bypassSsrInternalCache === true

		return siteAssetsClient.execute(
			{
				moduleParams,
				pageCompId,
				...(pageJsonFileName ? { pageJsonFileName } : {}),
				...(isErrorPage
					? {
							pageCompId: isErrorPage ? 'masterPage' : pageCompId,
							errorPageId: pageCompId,
							pageJsonFileName: pageJsonFileNames.masterPage,
					  }
					: {}),
				bypassSsrInternalCache,
			},
			siteAssetsFallback
		)
	},
	getResourceUrl(pageCompId, resourceType): string {
		const {
			siteAssets: { modulesParams, siteScopeParams },
		} = viewerModel

		const moduleParams = modulesParams[resourceType]
		const isErrorPage = !!errorPagesIds[pageCompId]

		const pageJsonFileNames = siteScopeParams.pageJsonFileNames
		const pageJsonFileName =
			pageJsonFileNames[pageCompId] || currentRouteInfo.getCurrentRouteInfo()?.pageJsonFileName

		return siteAssetsClient.calcPublicModuleUrl({
			moduleParams,
			pageCompId,
			...(pageJsonFileName ? { pageJsonFileName } : {}),
			...(isErrorPage
				? {
						pageCompId: isErrorPage ? 'masterPage' : pageCompId,
						errorPageId: pageCompId,
						pageJsonFileName: pageJsonFileNames.masterPage,
				  }
				: {}),
		})
	},
})

export const PageResourceFetcher = withDependencies<IPageResourceFetcher>(
	[ViewerModelSym, SiteAssetsClientSym, CurrentRouteInfoSymbol, optional(ProtectedPagesApiSymbol)],
	resourceFetcher
)
