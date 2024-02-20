const {
    traceHandlerIds: {
        SYSTEM_TRACING
    },
} = require('./loggerWithHandlers');
const {
    traceLevels
} = require('./traceLevels');

const initAppForPage = () => ({
    actionName: 'wixCode/initAppForPage',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const initAppForPageWithImportedNamespace = () => ({
    actionName: 'wixCode/initAppForPageWithImportedNamespace',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const initFetchImportedNamespaces = () => ({
    actionName: 'wixCode/fetchImportedNamespaces',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const initFetchDevImportedNamespaces = () => ({
    actionName: 'wixCode/fetchDevImportedNamespaces',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const loadUserCode = () => ({
    actionName: 'wixCode/loadUserCode',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const importAMDModule = () => ({
    actionName: 'wixCode/importAMDModule',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const createControllers = () => ({
    actionName: 'wixCode/createControllers',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const loadSiteMonitoringConfig = () => ({
    actionName: 'wixCode/loadSiteMonitoringConfig',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

const resolvePlatformApi = () => ({
    actionName: 'wixCode/resolvePlatformApi',
    options: {
        level: traceLevels.INFO,
        reportToHandlers: [SYSTEM_TRACING],
    },
});

module.exports.initAppForPage = initAppForPage;
module.exports.initAppForPageWithImportedNamespace =
    initAppForPageWithImportedNamespace;
module.exports.createControllers = createControllers;
module.exports.loadUserCode = loadUserCode;
module.exports.importAMDModule = importAMDModule;
module.exports.loadSiteMonitoringConfig = loadSiteMonitoringConfig;
module.exports.initFetchImportedNamespaces = initFetchImportedNamespaces;
module.exports.initFetchDevImportedNamespaces = initFetchDevImportedNamespaces;
module.exports.resolvePlatformApi = resolvePlatformApi;