const values_ = require('lodash/values');
const {
    reportRunCodeBi
} = require('./runCodeBi');
const {
    init: initSiteMonitoring
} = require('./siteMonitoring');
const traceCreators = require('./logger/traceCreators');

const SCRIPT_ERROR_MESSAGE = 'There was an error in your script';
const DISABLE_USER_CODE_QUERY_PARAM = 'wixCodeDisableUserCode';

function _shouldDisableUserCode(wixSdk) {
    const query = wixSdk.location.query || {};
    return query[DISABLE_USER_CODE_QUERY_PARAM] === 'true';
}

const createUserExports = ({
    appLogger,
    userConsole,
    modules
}) => {
    // Log errors from static event handlers, because
    // they are reported as "Script error" when
    // caught using the "error" global event handler
    try {
        return modules.reduce((userExports, module) => {
            Object.keys(module || {}).forEach((key) => {
                const originalFn = module[key];
                userExports[key] = function(...args) {
                    try {
                        return originalFn(...args);
                    } catch (e) {
                        // we log the error from our domain instead of throwing it, so we'll
                        // get a proper error and stack trace instead of "Script Error"
                        userConsole.error(e);
                    }
                };
            });
            return userExports;
        }, {});
    } catch (e) {
        appLogger.error(e);
    }
};

function runUserCode({
    userConsole,
    appLogger,
    fedopsLogger,
    wixSdk,
    userCodeModules,
    wixCodeScripts,
    instance,
    onLog,
    firstUserCodeRun,
    platformBi,
    codeAppId,
    globals,
} = {}) {
    try {
        if (_shouldDisableUserCode(wixSdk)) {
            return;
        }

        const loadingCodeMessages = wixCodeScripts.reduce((acc, script) => {
            acc[
                script.scriptName
            ] = `Running the code for the ${script.displayName}. To debug this code in your browser's dev tools, open ${script.scriptName}.`;

            return acc;
        }, {});

        if (firstUserCodeRun && !wixSdk.telemetry) {
            initSiteMonitoring({
                appLogger,
                fedopsLogger,
                wixSdk,
                instance,
                onLog,
                ignoredConsoleMessages: values_(loadingCodeMessages),
            });
        }

        if (wixCodeScripts.length === 0) {
            return {};
        }

        const modules = wixCodeScripts.map((script) => {
            if (userConsole && userConsole.info) {
                userConsole.info(loadingCodeMessages[script.scriptName]);
            }

            let module = {};
            if (!userCodeModules.has(script.url)) {
                appLogger.warn(
                    `Trying to run a user code script which was not loaded`, {
                        extra: {
                            script,
                        },
                    },
                );
                return undefined;
            }

            try {
                const moduleFunc = userCodeModules.get(script.url);
                module = moduleFunc && moduleFunc(globals);
            } catch (e) {
                userConsole.error(SCRIPT_ERROR_MESSAGE);
                userConsole.error(e);
            }

            reportRunCodeBi({
                appLogger,
                platformBi,
                codeAppId,
                pageName: script.displayName,
            });

            return module;
        });

        const userExports = createUserExports({
            appLogger,
            userConsole,
            modules
        });
        return userExports;
    } catch (e) {
        appLogger.error(e);
        throw e;
    }
}

const loadUserCodeAndRun = async ({
    globals,
    appLogger,
    wixSdk,
    scriptsMetaData,
    firstUserCodeRun,
    fedopsLogger,
    instance,
    onLog,
    userConsole,
    platformBi,
    codeAppId,
}) => {
    try {
        if (_shouldDisableUserCode(wixSdk)) {
            return;
        }

        const loadingCodeMessages = scriptsMetaData.reduce((acc, script) => {
            acc[
                script.scriptName
            ] = `Running the code for the ${script.displayName}. To debug this code in your browser's dev tools, open ${script.scriptName}.`;

            return acc;
        }, {});

        if (firstUserCodeRun && !wixSdk.telemetry) {
            void initSiteMonitoring({
                appLogger,
                fedopsLogger,
                wixSdk,
                instance,
                onLog,
                ignoredConsoleMessages: values_(loadingCodeMessages),
            });
        }

        if (scriptsMetaData.length === 0) {
            return;
        }

        const traceConfig = traceCreators.importAMDModule();
        fedopsLogger.interactionStarted(traceConfig.actionName);

        const modules = await Promise.all(
            scriptsMetaData.map((script) =>
                loadScriptAndRun({
                    script,
                    userConsole,
                    loadingCodeMessages,
                    wixSdk,
                    globals,
                    appLogger,
                    platformBi,
                    codeAppId,
                }),
            ),
        );

        fedopsLogger.interactionEnded(traceConfig.actionName);
        return createUserExports({
            appLogger,
            userConsole,
            modules
        });
    } catch (e) {
        appLogger.error(e);
        throw e;
    }
};

const loadScriptAndRun = async ({
    script,
    userConsole,
    loadingCodeMessages,
    wixSdk,
    globals,
    appLogger,
    platformBi,
    codeAppId,
}) => {
    if (userConsole && userConsole.info) {
        userConsole.info(loadingCodeMessages[script.scriptName]);
    }

    let module = {};

    try {
        module = await wixSdk.environment.network.importAMDModule(script.url, {
            globals,
        });
    } catch (e) {
        userConsole.error(SCRIPT_ERROR_MESSAGE);
        userConsole.error(e);
    }

    reportRunCodeBi({
        appLogger,
        platformBi,
        codeAppId,
        pageName: script.displayName,
    });

    return module;
};
module.exports = {
    runUserCode,
    loadUserCodeAndRun,
};