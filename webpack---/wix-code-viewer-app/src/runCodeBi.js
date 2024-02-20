const {
    pageCodeRun
} = require('./logger/biEventCreators');

const reportRunCodeBi = ({
    appLogger,
    platformBi,
    codeAppId,
    pageName
}) => {
    const {
        networkPageLoadStart,
        isServerSide,
        metaSiteId,
        viewerSessionId,
        pageId,
        pageUrl,
        viewMode,
    } = platformBi;
    if (isServerSide) {
        return;
    }

    const tsn = networkPageLoadStart ?
        Date.now() - Math.round(networkPageLoadStart) :
        null;

    const biEvent = pageCodeRun({
        metaSiteId,
        viewerSessionId,
        pageId,
        pageName,
        pageUrl,
        codeAppId,
        viewMode,
        tsn,
    });

    appLogger.bi(biEvent);
};

module.exports.reportRunCodeBi = reportRunCodeBi;