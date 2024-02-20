import {
    AnalyticsPromoteEndpoint,
    AnalyticsPromoteSrc,
    ElementsClick,
} from './consts';
export const checkLightboxLink = (link) => 'linkPopupId' in link;
export const checkIsTopBottomLink = (link) => 'anchorDataId' in link &&
    (link.anchorDataId === 'SCROLL_TO_TOP' ||
        link.anchorDataId === 'SCROLL_TO_BOTTOM');
export const extractPageLinkId = (link, metadata) => {
    if (checkLightboxLink(link)) {
        return link.linkPopupId;
    } else {
        const {
            pagesMap,
            mainPageId
        } = metadata || {};
        if (!pagesMap) {
            return undefined;
        }
        const pageUrl = new URL(link.href ? ? '');
        let value = Object.values(pagesMap).find(({
            pageUriSEO
        }) => {
            return pageUriSEO ? pageUrl.pathname ? .includes(pageUriSEO) : false;
        });
        // empty page in pathname - find main page entry
        if (!value) {
            value = mainPageId ? pagesMap[mainPageId] : undefined;
        }
        return value ? .pageId;
    }
};
export const extractAnalyticsClicksActionName = (link) => {
    if (link === undefined) {
        return undefined;
    }
    return link === null ? 'None' : link.type;
};
export const createAnalyticsClicksCommonParams = () => ({
    bl: navigator.language,
    url: window.location.href,
});
export const createAnalyticsClicksDetails = (link, metadata) => {
    if (!link ? .type) {
        return undefined;
    }
    const {
        type
    } = link;
    switch (type) {
        case 'AnchorLink':
            return !checkIsTopBottomLink(link) ?
                {
                    id: link.anchorDataId
                } :
                undefined;
        case 'DocumentLink':
            return {
                id: link.docInfo ? .docId
            };
        case 'PageLink':
            return {
                id: extractPageLinkId(link, metadata),
                isLightbox: checkLightboxLink(link),
            };
        default:
            return undefined;
    }
};
export const createAnalyticsClicksValue = (link, metadata) => {
    if (!link ? .type) {
        return undefined;
    }
    const {
        type
    } = link;
    switch (type) {
        case 'AnchorLink':
            return link.anchorDataId;
        case 'DocumentLink':
            return link.docInfo ? .name;
        case 'PageLink':
            const id = extractPageLinkId(link, metadata);
            return id && metadata ? .pagesMap ? .[id] ? .title;
        default:
            return link.href;
    }
};
export const tryReportAnalyticsClicksBi = (reportBi, params, context) => {
    const {
        link,
        value,
        details,
        actionName,
        elementType,
        trackClicksAnalytics,
        pagesMetadata: paramsPagesMetadata,
        ...restParams
    } = params;
    if (!trackClicksAnalytics) {
        return;
    }
    const pagesMetadata = paramsPagesMetadata && {
        ...paramsPagesMetadata,
        pagesMap: window.viewerModel ? .siteFeaturesConfigs ? .router ? .pagesMap,
    };
    const linkDetails = createAnalyticsClicksDetails(link, pagesMetadata);
    const biParamsDetails = details || linkDetails ?
        JSON.stringify({ ...linkDetails,
            ...details
        }) :
        undefined;
    const biParams = {
        ...restParams,
        ...createAnalyticsClicksCommonParams(),
        details: biParamsDetails,
        elementType: elementType ? ? 'Unknown',
        actionName: actionName ? ? extractAnalyticsClicksActionName(link),
        value: value ? ? createAnalyticsClicksValue(link, pagesMetadata),
    };
    void reportBi({
        src: AnalyticsPromoteSrc,
        evid: ElementsClick,
        ...biParams
    }, {
        endpoint: AnalyticsPromoteEndpoint,
        ...context
    });
};
//# sourceMappingURL=utils.js.map