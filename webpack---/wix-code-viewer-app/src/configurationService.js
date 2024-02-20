const ky = require('ky').default;

const {
    TelemetryConfigurationNetworkError,
} = require('./logger/errors/telemetryConfigurationNetworkError');
const traceCreators = require('./logger/traceCreators');

const create = ({
    appLogger,
    fedopsLogger,
    baseUrl,
    metaSiteId,
    instance
}) => {
    const SERVICE_ENDPOINT = `${baseUrl}/_api/wix-code-telemetry-registry-public/v1/sites/${metaSiteId}/telemetry`;
    const CONFIGURATION_URL = `${SERVICE_ENDPOINT}/runtime-configuration`;
    const fallbackConfiguration = {
        hasSinks: false
    };

    const makeRequest = () =>
        ky
        .get(CONFIGURATION_URL, {
            headers: {
                Authorization: instance,
            },
        })
        .then((response) => {
            return response.json();
        });

    const fetchConfiguration = () => {
        const traceConfig = traceCreators.loadSiteMonitoringConfig();

        return appLogger
            .traceAsync(traceConfig, async () => {
                fedopsLogger.interactionStarted(traceConfig.actionName);

                const config = await makeRequest();
                fedopsLogger.interactionEnded(traceConfig.actionName);

                return config;
            })
            .catch((e) => {
                appLogger.error(
                    new TelemetryConfigurationNetworkError(e, CONFIGURATION_URL),
                );

                return fallbackConfiguration;
            });
    };

    return {
        fetchConfiguration,
    };
};

module.exports.create = create;