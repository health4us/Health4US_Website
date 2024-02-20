const get_ = require('lodash/get');
const merge_ = require('lodash/merge');
const uniq_ = require('lodash/uniq');
const {
    serializeMessage,
} = require('@wix/santa-core-utils/dist/cjs/coreUtils/core/logWixCodeConsoleMessage');
const {
    fetchUserCode,
    fetchUserCodeAsync,
    prefetchUserCode,
} = require('./fetchUserCode');
const {
    runUserCode,
    loadUserCodeAndRun
} = require('./runUserCode');
const workerLogger = require('./workerLogger');
const {
    importSync,
    importAsync
} = require('./importScriptAsAmdModule');
const traceCreators = require('./logger/traceCreators');
const biEventCreators = require('./logger/biEventCreators');
const {
    createFedopsLogger
} = require('./fedopsCreator');
const {
    convertToDeveloperConsoleSeverity
} = require('./wixCodeLogLevel');
const {
    active$wBiFactoryCreator
} = require('./active$wBiEvent');
const {
    createUserCodeMapWithEnrichedUrls,
} = require('./createUserCodeMapWithEnrichedUrls');
const {
    isWebWorker
} = require('./isWebWorker');
const {
    resolveImportedNamespaceIfNeeded,
    resolveBaseUrl,
    resolveValidNamespaces,
} = require('./pageImportedNamespaces');
const {
    userCodeMapToSearchParamsMap
} = require('./userCodeMapUtils');
const {
    isAnalyzeImportedNamespaceParam,
    isInitPlatformApiProviderParam,
} = require('./queryParams');
const {
    getAppDefIdFromPackageNameWrapper,
} = require('./getAppDefIdFromPackageNameWrapper');
const {
    Experiments
} = require('./constants/Experiments');
const {
    createGlobals
} = require('./services/userCodeEnv');
const {
    resolveWixCodeAPIs,
    resolvePlatformNamespaceNames,
} = require('./platformNamespaceResolver');

const sendConsoleMessagesToEditor = (wixCodeApi) => (consoleMessage) => {
    if (consoleMessage.logLevel === 'ASSERT' && consoleMessage.args[0]) {
        return;
    }
    const developerConsoleMessage = {
        ...consoleMessage,
        logLevel: convertToDeveloperConsoleSeverity(consoleMessage.logLevel),
    };
    wixCodeApi.site.notifyEventToEditorApp('wix-code', {
        eventType: 'addConsoleMessage',
        eventPayload: {
            consoleMessage: serializeMessage(developerConsoleMessage),
        },
    });
};

const create = ({
    appLogger,
    userConsole
}) => {
    let userCodeModules = new Map();
    let pageImportedNamespaces = [];
    // In Live-Preview the app can be initialized multiple times
    // We want to make sure we do some things only once in that scenario
    // e.g. propagating console messages to the editor
    let firstInit = true;
    let firstUserCodeRun = true;

    let shouldUseAnalyzedImportedNamespace;
    let shouldInitPlatformApiProvider;
    let shouldLoadWithImportAMDModule;
    let shouldResolveMissingPlatformNamespaces;

    // We register to the console only if and when initAppForPage is invoked
    let onLog = () => {};

    let onUnhandledPromiseRejection = () => {};

    let fedopsLogger;

    const loadUserCode = async ({
        wixCodeApi,
        userCodeMap,
        viewMode,
        codePackagesData,
    }) => {
        const userCodeMapWithEnrichedUrls = createUserCodeMapWithEnrichedUrls({
            userCodeMap,
            codePackagesData,
        });

        if (shouldLoadWithImportAMDModule) {
            prefetchUserCode(userCodeMapWithEnrichedUrls, wixCodeApi);
        } else {
            userCodeModules = isWebWorker ?
                await fetchUserCode(
                    wixCodeApi.telemetry ? wixCodeApi.telemetry.console : userConsole,
                    appLogger,
                    fedopsLogger,
                    userCodeMapWithEnrichedUrls,
                    importSync,
                ) :
                await fetchUserCodeAsync(userCodeMapWithEnrichedUrls, importAsync);
        }

        if (viewMode === 'Site' && userCodeMap.length) {
            appLogger.bi(
                biEventCreators.userCodeLoaded({
                    pageId: userCodeMap[0].id
                }),
            );
        }

        return userCodeModules;
    };

    const initApp = async ({
        wixCodeApi,
        userCodeMap,
        codePackagesData,
        gridAppId,
        instance,
        fedopsLogger,
    }) => {
        const viewMode = get_(wixCodeApi, ['window', 'viewMode']);

        if (firstInit) {
            // TODO: Check if we need  the firstInit check when we merge the telemetry experiment.
            if (wixCodeApi.telemetry) {
                const listener = (event) => {
                    const reason = event.reason || {};
                    const error = new Error();

                    if (typeof reason === 'object') {
                        error.message = reason.message || reason.name;
                        error.stack = reason.stack || error.stack;
                    } else {
                        error.message = reason;
                    }

                    wixCodeApi.telemetry.console.error(error);
                };

                self.addEventListener('unhandledrejection', listener);
            } else {
                // TODO: Remove when merging the telemetry experiment. (Also delete workerLogger.js)
                // Wrapping the console should run before loading the user code,
                // in case the user code has errors that need to be reported (like syntax errors)
                onLog = workerLogger.wrapConsole(userConsole);
                onUnhandledPromiseRejection = workerLogger.handlePromiseRejections();
                if (viewMode !== 'Site') {
                    onLog(sendConsoleMessagesToEditor(wixCodeApi));
                    onUnhandledPromiseRejection(sendConsoleMessagesToEditor(wixCodeApi));
                }
            }

            firstInit = false;
        }

        const [userCodeResponse, pagesImportedNamespacesResponse] =
        await Promise.all([
            loadUserCode({
                wixCodeApi,
                userCodeMap,
                isWebWorker,
                viewMode,
                codePackagesData,
            }),
            resolveImportedNamespaceIfNeeded(
                shouldUseAnalyzedImportedNamespace,
                gridAppId,
                instance,
                viewMode,
                resolveBaseUrl(wixCodeApi),
                appLogger,
                codePackagesData,
                wixCodeApi,
                fedopsLogger,
            ),
        ]);
        userCodeModules = userCodeResponse;
        pageImportedNamespaces = pagesImportedNamespacesResponse;
    };

    const initAppLogger = ({
        wixCodeApi,
        reportTrace,
        biLoggerFactory,
        fedOpsLoggerFactory,
        createRavenClient,
        userCodeMap,
    }) => {
        const userId = get_(wixCodeApi, ['user', 'currentUser', 'id']);
        const viewMode = get_(wixCodeApi, ['window', 'viewMode']);

        appLogger.init({
            user: {
                id: userId,
            },
            hostType: isWebWorker ? 'worker' : 'iframe',
            viewMode,
            reportTrace,
            biLoggerFactory,
            fedOpsLoggerFactory,
            createRavenClient,
        });

        appLogger.addSessionData(() => {
            const elementoryArguments = {
                baseUrl: wixCodeApi.elementorySupport.baseUrl,
                queryParameters: wixCodeApi.elementorySupport.getQueryParameters(),
                options: wixCodeApi.elementorySupport.getRequestOptions(),
            };

            return {
                userCodeScripts: userCodeMap,
                elementoryArguments,
            };
        });
    };

    const initAppForPage = async (
        applicationData,
        platformUtils,
        eagerWixCodeApis,
        additionalParams,
    ) => {
        try {
            const {
                instance,
                // instanceId,
                // url,
                appData: {
                    userCodeMap,
                    codePackagesData,
                    codeAppId
                },
            } = applicationData;
            const {
                biLoggerFactory,
                fedOpsLoggerFactory,
                // getCsrfToken,
                monitoring,
                reportTrace,
                essentials,
            } = additionalParams;

            shouldLoadWithImportAMDModule = essentials.experiments.enabled(
                Experiments.LoadWithImportAMDModule,
            );
            const {
                platformApiProvider: {
                    getPlatformApi
                },
            } = platformUtils;

            const wixCodeApi = { ...eagerWixCodeApis
            };

            const searchParamsMap = userCodeMapToSearchParamsMap(userCodeMap);
            shouldUseAnalyzedImportedNamespace =
                isAnalyzeImportedNamespaceParam(searchParamsMap);
            shouldInitPlatformApiProvider =
                isInitPlatformApiProviderParam(searchParamsMap);
            shouldResolveMissingPlatformNamespaces = essentials.experiments.enabled(
                Experiments.ResolveMissingPlatformNamespaces,
            );

            const traceConfig = shouldUseAnalyzedImportedNamespace ?
                traceCreators.initAppForPageWithImportedNamespace() :
                traceCreators.initAppForPage();
            fedopsLogger = createFedopsLogger(fedOpsLoggerFactory);
            fedopsLogger.interactionStarted(traceConfig.actionName);

            if (shouldResolveMissingPlatformNamespaces) {
                const resolvedAPIs = await resolveWixCodeAPIs({
                    wixCodeApi,
                    getPlatformApi,
                    appLogger,
                    fedopsLogger,
                });

                merge_(wixCodeApi, resolvedAPIs);
            }

            const _isWebWorker = isWebWorker();
            initAppLogger({
                wixCodeApi,
                reportTrace,
                biLoggerFactory,
                fedOpsLoggerFactory,
                createRavenClient: monitoring.createMonitor,
                userCodeMap,
                isWebWorker: _isWebWorker,
            });

            await appLogger.traceAsync(traceConfig, () =>
                initApp({
                    wixCodeApi,
                    userCodeMap,
                    isWebWorker: _isWebWorker,
                    codePackagesData,
                    gridAppId: codeAppId,
                    instance,
                    fedopsLogger,
                }),
            );

            fedopsLogger.interactionEnded(traceConfig.actionName);
        } catch (e) {
            appLogger.error(e);
            throw e;
        }
    };

    const _createControllers = async (rawControllerConfigs) => {
        const [controllerConfig] = rawControllerConfigs;
        const {
            $w,
            wixCodeApi: eagerWixCodeApis,
            appParams: {
                instance,
                appData: {
                    userCodeMap,
                    codeAppId,
                    codePackagesData
                },
            },
            platformAPIs,
            platformApiProvider,
        } = controllerConfig;

        if (userCodeMap.length > 0) {
            const wixCodeApi = { ...eagerWixCodeApis
            };
            const active$wBiFactory = active$wBiFactoryCreator({
                appLogger,
                platformBi: platformAPIs.bi,
            });

            if (shouldInitPlatformApiProvider) {
                const validNamespaces = shouldResolveMissingPlatformNamespaces ?
                    resolvePlatformNamespaceNames(pageImportedNamespaces) :
                    resolveValidNamespaces(pageImportedNamespaces);

                const resolvedAPIs = await resolveWixCodeAPIs({
                    apis: uniq_(validNamespaces),
                    appLogger,
                    fedopsLogger,
                    wixCodeApi,
                    getPlatformApi: platformApiProvider.getPlatformApi,
                });

                merge_(wixCodeApi, resolvedAPIs);
            }

            const userCodeMapWithEnrichedUrls = createUserCodeMapWithEnrichedUrls({
                userCodeMap,
                codePackagesData,
            });

            const globalsToInject = createGlobals({
                active$wBiFactory,
                $w,
                wixSdk: wixCodeApi,
                userConsole: wixCodeApi.telemetry ?
                    wixCodeApi.telemetry.console :
                    userConsole,
                getAppDefIdFromPackageName: getAppDefIdFromPackageNameWrapper(codePackagesData),
            });

            const commonArgs = {
                appLogger,
                codeAppId,
                firstUserCodeRun,
                fedopsLogger,
                globals: globalsToInject,
                instance,
                onLog,
                platformBi: platformAPIs.bi,
                userConsole: wixCodeApi.telemetry ?
                    wixCodeApi.telemetry.console :
                    userConsole,
                wixSdk: wixCodeApi,
            };

            const userExports = shouldLoadWithImportAMDModule ?
                await loadUserCodeAndRun({
                    ...commonArgs,
                    scriptsMetaData: userCodeMapWithEnrichedUrls,
                }) :
                runUserCode({
                    ...commonArgs,
                    userCodeModules,
                    wixCodeScripts: userCodeMapWithEnrichedUrls,
                });

            firstUserCodeRun = false;

            wixCodeApi.events.setStaticEventHandlers(userExports);
        }

        // We don't really have controller instances, so we return an empty array
        return [];
    };

    const createControllers = async (rawControllerConfigs) => {
        try {
            const traceConfig = traceCreators.createControllers();
            fedopsLogger.interactionStarted(traceConfig.actionName);

            const controllers = await appLogger.traceAsync(traceConfig, () =>
                _createControllers(rawControllerConfigs),
            );

            fedopsLogger.interactionEnded(traceConfig.actionName);
            return controllers;
        } catch (e) {
            appLogger.error(e);
            throw e;
        }
    };

    return {
        initAppForPage,
        createControllers,
    };
};

module.exports.create = create;