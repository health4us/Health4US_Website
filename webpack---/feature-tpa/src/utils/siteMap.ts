import _ from 'lodash'
import { createLinkUtils } from '@wix/thunderbolt-commons'
import type { SiteMapItemLink, SiteMapItem, SiteMapItems } from '@wix/thunderbolt-becky-types'
import type { TpaCommonsSiteConfig } from 'feature-tpa-commons'
import type { IRoutingLinkUtilsAPI } from 'feature-router'
import type { ILightboxUtils } from 'feature-lightbox'
import type { IMultilingualLinkUtilsAPI } from 'feature-multilingual'
import type { SiteMapLink } from '../types'
import { LINK_TYPES } from './constants'
import { Experiments } from '@wix/thunderbolt-symbols'

export const MULTI_SECTION_DELIMITER = '$TPA$'

export const LINK_PANEL_PROPS = {
	[LINK_TYPES.PAGE_LINK]: ['type', 'pageId'],
	[LINK_TYPES.EXTERNAL_LINK]: ['type', 'target', 'url'],
	[LINK_TYPES.ANCHOR_LINK]: ['type', 'anchorName', 'anchorDataId', 'pageId'],
	[LINK_TYPES.EMAIL_LINK]: ['type', 'recipient', 'subject'],
	[LINK_TYPES.PHONE_LINK]: ['type', 'phoneNumber'],
	[LINK_TYPES.WHATSAPP_LINK]: ['type', 'phoneNumber'],
	[LINK_TYPES.DOCUMENT_LINK]: ['type', 'docId', 'name'],
	[LINK_TYPES.DYNAMIC_PAGE_LINK]: ['type', 'routerId', 'innerRoute', 'anchorDataId'],
	[LINK_TYPES.ADDRESS_LINK]: ['type', 'address'],
}

function isPageMarkedAsHideFromMenu(
	appsClientSpecMapData: TpaCommonsSiteConfig['appsClientSpecMapData'],
	appsClientSpecMapByApplicationId: TpaCommonsSiteConfig['appsClientSpecMapByApplicationId'],
	experiments: Experiments,
	linkObject: SiteMapItemLink
) {
	if (!linkObject) {
		return false
	}
	if (linkObject.type === LINK_TYPES.PAGE_LINK) {
		const deprecateAppIdExperimentOn = experiments['specs.thunderbolt.deprecateAppId']

		const getAppDataByAppId = () => {
			const applicationId = linkObject.pageId?.tpaApplicationId
			return appsClientSpecMapByApplicationId![applicationId!]
		}
		const getAppDataByAppDefId = () => {
			const appDefinitionId = linkObject.pageId?.appDefinitionId
			return appsClientSpecMapData[appDefinitionId!]
		}

		let tpaPageId = linkObject.pageId?.tpaPageId

		const appData = deprecateAppIdExperimentOn ? getAppDataByAppDefId() : getAppDataByAppId()

		if (appData && tpaPageId) {
			if (_.includes(tpaPageId, MULTI_SECTION_DELIMITER)) {
				tpaPageId = tpaPageId.substr(0, tpaPageId.indexOf(MULTI_SECTION_DELIMITER))
			}
			const section = _.find(appData.widgets, (widget) => widget.appPage?.id === tpaPageId)
			return section?.appPage.hideFromMenu
		}
	}
	return false
}

function getSitePagesFromMenuItems({ menuItems, mainPageId, baseUrl, linkUtils }: any): Array<SiteMapLink> {
	return _.map(menuItems, (item) => {
		const result = getEnhancedPageInfo(item, mainPageId, baseUrl, linkUtils)
		if (result.type === LINK_TYPES.PAGE_LINK || result.type === LINK_TYPES.MENU_HEADER) {
			const subPages = _.map(item.items, (subItem) =>
				getEnhancedPageInfo(subItem, mainPageId, baseUrl, linkUtils)
			)
			if (_.size(subPages) > 0) {
				_.assign(result, {
					subPages,
				})
			}
		}
		return result
	})
}

function getRelevantLinkDataFromMenuItem(menuItem: any): SiteMapLink {
	const link = _.pick(menuItem.link, LINK_PANEL_PROPS[menuItem.link.type])
	if (_.isObject(link.pageId)) {
		link.pageId = `#${_.get(link, 'pageId.id')}`
	}
	if (link.anchorDataId) {
		const anchorDataId = _.get(link, 'anchorDataId.id', link.anchorDataId)
		if (anchorDataId === 'SCROLL_TO_TOP' || anchorDataId === 'SCROLL_TO_BOTTOM') {
			link.anchorDataId = anchorDataId
		} else {
			link.anchorDataId = `#${anchorDataId}`
		}
	}
	return link
}

function getEnhancedPageInfo(menuItem: any, mainPageId: string, baseUrl: string, linkUtils: any): SiteMapLink {
	const title = menuItem.label || ''
	const hidden = !menuItem.isVisible || false
	const linkData = menuItem.link ? getRelevantLinkDataFromMenuItem(menuItem) : {}
	const link = _.merge(linkData, {
		title,
		hidden,
	})

	if (!link.type) {
		return {
			type: LINK_TYPES.MENU_HEADER,
			hidden,
			title,
			subPages: link.subPages,
		}
	}

	switch (link.type) {
		default:
		case LINK_TYPES.PAGE_LINK:
			_.merge(link, getExtraPageInfo(menuItem, mainPageId, baseUrl))
			break
		case LINK_TYPES.ANCHOR_LINK:
			_.merge(link, getExtraPageInfo(menuItem, mainPageId, baseUrl))
			break
		case LINK_TYPES.DOCUMENT_LINK:
			const linkUrl = linkUtils.getLinkUrlFromDataItem(link)
			const linkProps = linkUtils.getLinkProps(linkUrl)
			link.url = linkProps.href
			break
	}

	return link
}

function getExtraPageInfo(pageData: any, mainPageId: string, baseUrl: string) {
	const pageUriSEO = pageData.link?.pageId?.pageUriSEO
	const info = {
		isHomePage: pageData.link?.pageId?.id === mainPageId,
	}
	if (pageUriSEO) {
		_.assign(info, { url: baseUrl + '/' + pageUriSEO })
	}
	return info
}

export function getSiteMap(
	siteMapItems: SiteMapItems,
	tpaCommonsSiteConfig: TpaCommonsSiteConfig,
	routingLinkUtilsAPI: IRoutingLinkUtilsAPI,
	lightboxUtils: ILightboxUtils,
	experiments: Experiments,
	multilingualLinkUtilsAPI?: IMultilingualLinkUtilsAPI
) {
	const {
		externalBaseUrl,
		appsClientSpecMapData,
		appsClientSpecMapByApplicationId,
		metaSiteId,
		userFileDomainUrl,
		routersConfig,
		isMobileView,
		isPremiumDomain,
	} = tpaCommonsSiteConfig

	const linkUtilsRoutingInfo = routingLinkUtilsAPI.getLinkUtilsRoutingInfo()
	const linkUtils = createLinkUtils({
		routingInfo: linkUtilsRoutingInfo,
		metaSiteId,
		userFileDomainUrl,
		routersConfig,
		popupPages: lightboxUtils?.getLightboxPages(),
		multilingualInfo: multilingualLinkUtilsAPI?.getMultilingualInfo(),
		isMobileView,
		isPremiumDomain,
		experiments,
	})

	return getSitePagesFromMenuItems({
		menuItems: _.filter(
			siteMapItems,
			({ link }: SiteMapItem) =>
				!isPageMarkedAsHideFromMenu(appsClientSpecMapData, appsClientSpecMapByApplicationId, experiments, link)
		),
		mainPageId: linkUtilsRoutingInfo.mainPageId,
		baseUrl: externalBaseUrl,
		linkUtils,
	})
}
