const userCodeLoaded = ({
    pageId
}) => ({
    evid: 133,
    worker_id: pageId
});
const active$wSiteViewMode = ({
    isPopup,
    isServerSide,
    pageId,
    pageNumber,
    pageUrl,
    tsn,
}) => ({
    evid: 136,
    worker_id: pageId,
    is_lightbox: isPopup,
    isServerSide,
    pn: pageNumber,
    page_url: pageUrl,
    tsn,
});
const active$wPreviewMode = ({
    pageNumber,
    pageUrl,
    tsn,
    pageId
}) => ({
    evid: 150,
    pn: pageNumber,
    pageurl: pageUrl,
    pageId,
    tsn,
});

const pageCodeRun = ({
    metaSiteId,
    viewerSessionId,
    pageId,
    pageName,
    pageUrl,
    codeAppId,
    viewMode,
    tsn,
}) => ({
    evid: 272,
    msid: metaSiteId,
    vsi: viewerSessionId,
    pageId,
    file_code: pageName,
    page_url: pageUrl,
    code_app_id: codeAppId,
    running_environment: viewMode,
    tsn,
});

module.exports = {
    userCodeLoaded,
    active$wSiteViewMode,
    active$wPreviewMode,
    pageCodeRun,
};