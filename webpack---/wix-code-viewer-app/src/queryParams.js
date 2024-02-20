const ANALYZE_IMPORTED_NAMESPACES_QUERY_PARAM = 'analyze-imported-namespaces';
const INIT_PLATFORM_API_PROVIDER_QUERY_PARAM = 'init-platform-api-provider';

const isAnalyzeImportedNamespaceParam = (searchParamsMap) =>
    searchParamsMap.get(ANALYZE_IMPORTED_NAMESPACES_QUERY_PARAM) === 'true';

const isInitPlatformApiProviderParam = (searchParamsMap) =>
    searchParamsMap.get(INIT_PLATFORM_API_PROVIDER_QUERY_PARAM) === 'true';

module.exports = {
    isAnalyzeImportedNamespaceParam,
    isInitPlatformApiProviderParam,
    ANALYZE_IMPORTED_NAMESPACES_QUERY_PARAM,
    INIT_PLATFORM_API_PROVIDER_QUERY_PARAM,
};