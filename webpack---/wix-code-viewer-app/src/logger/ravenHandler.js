const parser = require('ua-parser-js');
const {
    union
} = require('@wix/wix-code-adt');
const {
    matchAny
} = require('@wix/wix-code-client-logger');
const noop_ = require('lodash/noop');
const merge_ = require('lodash/merge');
const fromPairs_ = require('lodash/fromPairs');
const {
    configureForViewerWorker,
} = require('@wix/dbsm-common/src/raven/configureForViewerWorker');
const {
    ERROR_NAME: LOAD_USER_CODE_ERROR_NAME,
} = require('./errors/loadUserCodeError');
const {
    ERROR_NAME: TELEMETRY_CONFIGURATION_NETWORK_ERROR_NAME,
} = require('./errors/telemetryConfigurationNetworkError');
const {
    ERROR_NAME: TELEMETRY_SEND_LOG_ERROR_NAME,
} = require('./errors/telemetryLogSendError');

const dsn = 'https://760a5dce5978409b86a97e1ccd21aa7a@sentry.wixpress.com/154';

const Environment = union('Environment', {
    NotInitialized() {},
    Initialized({
        createRavenClient,
        ravenOptions,
        user,
        hostType
    }) {
        const raven = createRavenClient(dsn);
        configureForViewerWorker({
            Raven: raven,
            globalScope: global,
            dsn,
            appName: 'wix-code-viewer-app',
            params: ravenOptions,
        });

        raven.setUserContext(user);
        raven.setTagsContext({
            hostType
        });

        return {
            raven
        };
    },
});

const LEVELS = {
    WARNING: 'warning',
    ERROR: 'error',
};

const ravenHandlerCreator =
    ({
        ravenOptions
    } = {}) =>
    () => {
        let environment = Environment.NotInitialized();

        const getRaven = (errorOrMessage) =>
            environment.matchWith({
                Initialized: ({
                    raven
                }) => raven,
                NotInitialized: () => {
                    const finalMessage =
                        (errorOrMessage && errorOrMessage.stack) || errorOrMessage;
                    throw new Error(
                        `You cannot use raven before setting the logger environment. Original message: ${finalMessage}`,
                    );
                },
            });

        const calculateIsBrowserUnsupported = () => {
            try {
                const {
                    os,
                    browser
                } = parser(self.navigator.userAgent);
                const osVersion = parseFloat(os.version);
                const browserVersion = parseInt(browser.major, 10);
                const unsupportedIOS =
                    (os.name === 'iOS' && osVersion < 11) ||
                    (browser.name === 'Safari' && browserVersion < 11);
                const unsupportedAndroid = os.name === 'Android' && osVersion < 7;
                const unsupportedBrowser =
                    (browser.name === 'QQBrowser' && browserVersion < 9) ||
                    (browser.name === 'Chrome' && browserVersion < 50);

                return unsupportedIOS || unsupportedAndroid || unsupportedBrowser;
            } catch (e) {
                return false;
            }
        };

        const isBrowserUnsupported = calculateIsBrowserUnsupported();

        const createReportOptions = ({
            level,
            sessionData,
            options = {},
            fingerprint,
            tags = {},
            extra = {},
        }) => {
            return merge_({
                    level
                }, {
                    extra: sessionData
                }, {
                    extra
                }, {
                    tags
                }, {
                    fingerprint
                },
                options,
            );
        };

        const getResponseDataFromError = (error) => {
            try {
                if (error.response) {
                    const {
                        headers,
                        status,
                        url
                    } = error.response;
                    return {
                        headers: fromPairs_([...headers.entries()]),
                        status,
                        url,
                    };
                }
            } catch (e) {
                return e.stack;
            }
        };

        const isUnknownNetworkError = (error) => {
            // Requests made by ky have a "response" object
            // only if we got a response from some server.
            // Otherwise it's an unknown fetch error
            return !error.response;
        };

        const isResponseFromWixServer = (response) => {
            return response && response.headers.has('x-seen-by');
        };

        const getErrorLevel = (error) => {
            switch (error.name) {
                case TELEMETRY_CONFIGURATION_NETWORK_ERROR_NAME:
                    {
                        if (isUnknownNetworkError(error.originalError)) {
                            return LEVELS.WARNING;
                        }
                        if (!isResponseFromWixServer(error.originalError.response)) {
                            return LEVELS.WARNING;
                        }
                        return LEVELS.ERROR;
                    }
                case TELEMETRY_SEND_LOG_ERROR_NAME:
                    return LEVELS.WARNING;
                case LOAD_USER_CODE_ERROR_NAME:
                    return LEVELS.WARNING;
                default:
                    return LEVELS.ERROR;
            }
        };

        const getRavenExtraData = (error) => {
            switch (error.name) {
                case TELEMETRY_CONFIGURATION_NETWORK_ERROR_NAME:
                    {
                        const isWix = isResponseFromWixServer(error.originalError.response) ?
                            'wix-server' :
                            'non-wix-server';
                        const fingerprint = [
                            TELEMETRY_CONFIGURATION_NETWORK_ERROR_NAME,
                            isWix,
                        ];
                        const tags = {
                            requestUrl: error.url,
                        };
                        const extraResponseData = getResponseDataFromError(
                            error.originalError,
                        );
                        if (extraResponseData && extraResponseData.status !== undefined) {
                            tags.httpStatus = extraResponseData.status;
                            fingerprint.push(String(extraResponseData.status));
                        }

                        return {
                            fingerprint,
                            tags,
                            extra: {
                                extraResponseData,
                                originalError: error.originalError.stack,
                            },
                        };
                    }
                case TELEMETRY_SEND_LOG_ERROR_NAME:
                    {
                        const isWix = isResponseFromWixServer(error.originalError.response) ?
                            'wix-server' :
                            'non-wix-server';
                        const fingerprint = [TELEMETRY_SEND_LOG_ERROR_NAME, isWix];
                        const extraResponseData = getResponseDataFromError(
                            error.originalError,
                        );
                        if (extraResponseData && extraResponseData.status !== undefined) {
                            fingerprint.push(String(extraResponseData.status));
                        }
                        return {
                            fingerprint,
                            extra: {
                                extraResponseData,
                                logsPayload: error.payload,
                                originalError: error.originalError.stack,
                            },
                        };
                    }
                case LOAD_USER_CODE_ERROR_NAME:
                    const tags = {
                        requestUrl: error.url,
                        isCompressed: error.url.includes('use-compressed-bundle'),
                    };
                    const fingerprint = [`new_${LOAD_USER_CODE_ERROR_NAME}`];
                    const extraResponseData = getResponseDataFromError(
                        error.originalError,
                    );
                    if (extraResponseData && extraResponseData.status !== undefined) {
                        tags.httpStatus = extraResponseData.status;
                        fingerprint.push(String(extraResponseData.status));
                    }
                    return {
                        tags,
                        fingerprint,
                        extra: {
                            extraResponseData,
                            originalError: error.originalError.stack,
                        },
                    };
                default:
                    return {};
            }
        };

        const captureException = ({
            raven,
            error,
            options,
            sessionData
        }) => {
            try {
                const level = getErrorLevel(error);
                const {
                    tags,
                    extra,
                    fingerprint
                } = getRavenExtraData(error);

                const finalOptions = createReportOptions({
                    level,
                    sessionData,
                    options,
                    fingerprint,
                    tags,
                    extra,
                });
                raven.captureException(error, finalOptions);
            } catch (e) {
                raven.captureException(error);
            }
        };

        return {
            init: ({
                user,
                hostType,
                createRavenClient
            }) => {
                environment = Environment.Initialized({
                    createRavenClient,
                    ravenOptions,
                    user,
                    hostType,
                });
            },
            log: (logEvent) => {
                if (isBrowserUnsupported) {
                    return;
                }

                logEvent.matchWith({
                    Info: ({
                        message,
                        options,
                        sessionData
                    }) => {
                        const raven = getRaven(message);
                        raven.captureMessage(
                            message,
                            createReportOptions({
                                level: 'info',
                                sessionData,
                                options
                            }),
                        );
                    },
                    Warn: ({
                        message,
                        options,
                        sessionData
                    }) => {
                        const raven = getRaven(message);

                        raven.captureMessage(
                            message,
                            createReportOptions({
                                level: 'warning',
                                sessionData,
                                options,
                            }),
                        );
                    },
                    Error: ({
                        error,
                        options,
                        sessionData
                    }) => {
                        const raven = getRaven(error);
                        captureException({
                            raven,
                            error,
                            options,
                            sessionData
                        });
                    },
                    [matchAny]: noop_,
                });
            },
        };
    };

module.exports.ravenHandlerCreator = ravenHandlerCreator;