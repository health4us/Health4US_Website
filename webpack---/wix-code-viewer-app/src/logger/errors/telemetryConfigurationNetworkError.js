const ERROR_NAME = 'TelemetryConfigurationNetworkError';

class TelemetryConfigurationNetworkError extends Error {
    constructor(originalError, url) {
        super(originalError.message);
        this.name = ERROR_NAME;
        this.originalError = originalError;
        this.url = url;
    }
}

module.exports.TelemetryConfigurationNetworkError =
    TelemetryConfigurationNetworkError;
module.exports.ERROR_NAME = ERROR_NAME;