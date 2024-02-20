const {
    namespaceToSdk
} = require('@wix/wix-code-viewer-utils');
const memoize_ = require('lodash/memoize');
const {
    NamespaceInitializationError,
} = require('./logger/errors/namespaceInitializationError');
const traceCreators = require('./logger/traceCreators');

const apisInInternalUse = ['window', 'site', 'telemetry', 'user', 'storage'];
const wixCodeViewerAppApis = ['fetch', 'events'];

const resolveWixCodeAPIs = async ({
    apis = apisInInternalUse,
    wixCodeApi,
    getPlatformApi,
    appLogger,
    fedopsLogger,
}) => {
    const resolvePlatformApi = memoize_(async ({
        api
    }) => {
        const fedopsActionName = traceCreators.resolvePlatformApi().actionName;
        fedopsLogger.interactionStarted(fedopsActionName);
        const resolvedApi = await getPlatformApi(api);
        fedopsLogger.interactionEnded(fedopsActionName);
        return resolvedApi;
    });

    const apisToResolve = apis.filter(
        (api) => !wixCodeViewerAppApis.includes(api) && !wixCodeApi[api],
    );

    const resolvedPlatformAPIs = await Promise.all(
        apisToResolve.map((api) =>
            resolvePlatformApi({
                api
            }).catch((e) =>
                appLogger.error(new NamespaceInitializationError(api, e ? .message)),
            ),
        ),
    );

    return resolvedPlatformAPIs.reduce((acc, api, idx) => {
        acc[apisToResolve[idx]] = api;
        return acc;
    }, {});
};

const resolvePlatformNamespaceNames = (namespaces) => {
    return namespaces
        .concat(apisInInternalUse)
        .map((namespace) => namespaceToSdk(namespace));
};

module.exports.resolveWixCodeAPIs = resolveWixCodeAPIs;
module.exports.resolvePlatformNamespaceNames = resolvePlatformNamespaceNames;