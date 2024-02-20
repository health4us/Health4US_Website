const {
    getDecodedInstance
} = require('./getDecodedInstance');
const get_ = require('lodash/get');
const uniq_ = require('lodash/uniq');
const flatten_ = require('lodash/flatten');
const {
    ModuleList
} = require('@wix/auto-frontend-module-registry');
const traceCreators = require('./logger/traceCreators');

const PREVIEW_BASE_URL = '_api/cloud-user-code-dev-analyzer/v1/apps';
const LIVE_BASE_URL = '_api/cloud-user-code-analyzer/v1/apps';
const DEFAULT_BASE_URL = 'https://www.wix.com';
const ENDPOINT_SUFFIX = 'pages-imported-namespaces';
const {
    generateDependenciesTokenFromCodePackages,
} = require('./createUserCodeMapWithEnrichedUrls');

const IMPORTED_NAMESPACES_KEY = 'importedNamespaces';

const evaluateUrl = (baseUrl, gridAppId, metaSiteId, codePackagesData) => {
    return `${baseUrl}/${LIVE_BASE_URL}/${gridAppId}/${ENDPOINT_SUFFIX}?${new URLSearchParams(
    {
      metaSiteId,
      gridAppId,
      dependenciesToken:
        generateDependenciesTokenFromCodePackages(codePackagesData),
    },
  )}`;
};

const resolveBaseUrl = (wixCodeApi) => {
    return get_(wixCodeApi, ['location', 'baseUrl'], DEFAULT_BASE_URL);
};

const resolveImportedNamespaceIfNeeded = async (
    shouldUseAnalyzedImportedNamespace,
    gridAppId,
    instance,
    viewMode,
    baseUrl,
    logger,
    codePackageData,
    wixCodeApi,
    fedopsLogger,
) => {
    if (!shouldUseAnalyzedImportedNamespace) {
        return [];
    }

    if (viewMode === 'Preview') {
        return DEFAULT_NAMESPACE_LIST;
    }

    const warmedUpNamespaces = wixCodeApi.window.warmupData.get(
        IMPORTED_NAMESPACES_KEY,
    );

    if (warmedUpNamespaces) {
        wixCodeApi.storage.memory.setItem(
            IMPORTED_NAMESPACES_KEY,
            warmedUpNamespaces.join(','),
        );
        return warmedUpNamespaces;
    }

    const storedNamespacesStr = wixCodeApi.storage.memory.getItem(
        IMPORTED_NAMESPACES_KEY,
    );

    if (storedNamespacesStr) {
        const storedNamespaces = storedNamespacesStr.split(',');
        return storedNamespaces;
    }

    const traceConfig =
        viewMode === 'Site' ?
        traceCreators.initFetchImportedNamespaces() :
        traceCreators.initFetchDevImportedNamespaces();

    fedopsLogger.interactionStarted(traceConfig.actionName);

    const namespaces = await Promise.race([
        resolveImportedNamespaceForPages(
            gridAppId,
            instance,
            baseUrl,
            logger,
            codePackageData,
            wixCodeApi,
        ),
        importedNamespaceTimeoutPromise(logger),
    ]);

    fedopsLogger.interactionEnded(traceConfig.actionName);

    return namespaces;
};

const importedNamespaceTimeoutPromise = async (logger) => {
    return new Promise((res) => {
        setTimeout(() => {
            logger.error('Resolving imported namespaces is hung timeout was reached');
            res(DEFAULT_NAMESPACE_LIST);
        }, IMPORTED_NAMESPACE_TIMEOUT_IN_MILLIS);
    });
};

const resolveImportedNamespaceForPages = async (
    gridAppId,
    instance,
    baseUrl,
    logger,
    codePackageData,
    wixCodeApi,
) => {
    try {
        const {
            metaSiteId
        } = getDecodedInstance(instance);
        const url = evaluateUrl(baseUrl, gridAppId, metaSiteId, codePackageData);

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: instance
            },
        });

        if (res.status !== 200) {
            logger.error('Unable to resolve imported namespaces', res.error);

            return DEFAULT_NAMESPACE_LIST;
        }
        const data = await res.json();

        const importedNamespaces = parseImportedNamespaceResult(data);

        wixCodeApi.window.warmupData.set(
            IMPORTED_NAMESPACES_KEY,
            importedNamespaces,
        );

        wixCodeApi.storage.memory.setItem(
            IMPORTED_NAMESPACES_KEY,
            importedNamespaces,
        );

        return importedNamespaces;
    } catch (e) {
        logger.error('Unable to resolve imported namespaces', e.message);
        return DEFAULT_NAMESPACE_LIST;
    }
};

function parseImportedNamespaceResult(pagesImportedNamespacesResult) {
    const {
        pagesImportedNamespaces
    } = pagesImportedNamespacesResult;
    const importedNamespacePerPage = pagesImportedNamespaces.map(
        ({
            importedNamespaces
        }) =>
        importedNamespaces ? importedNamespaces.map(({
            name
        }) => name) : [],
    );

    return uniq_(flatten_(importedNamespacePerPage));
}

function filterValidNamespaces(namespaces) {
    return namespaces.filter((namespace) => ModuleList.includes(namespace));
}

function resolveNamespaceName(namespace) {
    return namespace.replace('wix-', '');
}

function resolveValidNamespaces(namespaces) {
    return filterValidNamespaces(namespaces).map(resolveNamespaceName);
}

const DEFAULT_NAMESPACE_LIST = ModuleList;

const IMPORTED_NAMESPACE_TIMEOUT_IN_MILLIS = 1000;

module.exports.resolveImportedNamespaceIfNeeded =
    resolveImportedNamespaceIfNeeded;
module.exports.evaluateUrl = evaluateUrl;
module.exports.resolveBaseUrl = resolveBaseUrl;
module.exports.resolveValidNamespaces = resolveValidNamespaces;
module.exports.PREVIEW_BASE_URL = PREVIEW_BASE_URL;
module.exports.LIVE_BASE_URL = LIVE_BASE_URL;
module.exports.IMPORTED_NAMESPACE_TIMEOUT_IN_MILLIS =
    IMPORTED_NAMESPACE_TIMEOUT_IN_MILLIS;