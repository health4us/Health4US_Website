const traceCreators = require('./logger/traceCreators');

function getEmptyModule() {
    return {};
}

function fetchUserCode(
    userConsole,
    appLogger,
    fedopsLogger,
    wixCodeScripts,
    importScriptFunc,
) {
    const traceConfig = traceCreators.loadUserCode();
    return wixCodeScripts.reduce((acc, script) => {
        try {
            return appLogger.traceSync(traceConfig, () => {
                fedopsLogger.interactionStarted(traceConfig.actionName);

                const moduleFunc = importScriptFunc(script.url);
                acc.set(script.url, moduleFunc);

                fedopsLogger.interactionEnded(traceConfig.actionName);
                return acc;
            });
        } catch (e) {
            appLogger.error(e);
            userConsole.error(e);
            acc.set(script.url, getEmptyModule);
            return acc;
        }
    }, new Map());
}

async function fetchUserCodeAsync(wixCodeScripts, loadAmdFunc) {
    const userCodeModules = new Map();
    await wixCodeScripts.reduce(
        (promise, script) =>
        promise
        .then(() => loadAmdFunc(script.url))
        .then((userCode) => userCodeModules.set(script.url, userCode)),
        Promise.resolve(),
    );

    return userCodeModules;
}

function prefetchUserCode(wixCodeScripts, wixCodeApi) {
    wixCodeScripts.forEach((script) =>
        wixCodeApi.environment.network.prefetchScript(script.url),
    );
}

module.exports.fetchUserCode = fetchUserCode;
module.exports.fetchUserCodeAsync = fetchUserCodeAsync;
module.exports.prefetchUserCode = prefetchUserCode;