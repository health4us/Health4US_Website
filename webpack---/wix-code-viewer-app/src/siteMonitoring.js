const get_ = require('lodash/get');
const {
    wixCodeLogLevel,
    siteMonitoringSeverity,
    convertToSiteMonitoringSeverity,
} = require('./wixCodeLogLevel');
const {
    create: createConfigurationService,
} = require('./configurationService');
const {
    throttledLogSender
} = require('./throttledLogSender');
const {
    create: createLogEntryFactory
} = require('./logEntry');
const {
    getDecodedInstance
} = require('./getDecodedInstance');

function getMessageFromErrorObject(error) {
    return error.stack || error.message || error.name || error;
}

function createNiceStackTrace(message, stack) {
    try {
        return message + '\n' + stack.split('\n').slice(1).join('\n');
    } catch (e) {
        return message + '\n' + stack;
    }
}

function normalizeArgs(val) {
    if (val === null) {
        return String(val);
    } else if (val === undefined) {
        return String(undefined);
    } else if (typeof val === 'object') {
        return JSON.stringify(val);
    } else {
        return val;
    }
}

function registerToConsoleMessages(callback, onWorkerLoggerLog) {
    return onWorkerLoggerLog(({
        logLevel,
        args,
        stack
    }) => {
        if (logLevel === wixCodeLogLevel.ASSERT) {
            const assertion = args[0];
            if (assertion) {
                const joinedAssertionArgs = args.slice(1).map(normalizeArgs).join(' ');
                callback({
                    message: joinedAssertionArgs,
                    severity: siteMonitoringSeverity.ERROR,
                });
            }
        } else if (logLevel !== wixCodeLogLevel.VERBOSE) {
            const joinedArgs = args.map(normalizeArgs).join(' ');
            const message = [wixCodeLogLevel.ERROR, wixCodeLogLevel.TRACE].includes(
                    logLevel,
                ) ?
                createNiceStackTrace(joinedArgs, stack) :
                joinedArgs;

            const severity = convertToSiteMonitoringSeverity(logLevel);
            callback({
                message,
                severity
            });
        }
    });
}

function registerToUncaughtRejections(callback) {
    const listener = (event) => {
        const error = event.reason || {};
        const message = getMessageFromErrorObject(error);
        callback({
            message,
            severity: siteMonitoringSeverity.ERROR
        });
    };

    self.addEventListener('unhandledrejection', listener);

    return () => self.removeEventListener('unhandledrejection', listener);
}

const registerListeners = ({
    sendLog,
    onWorkerLoggerLog
}) => {
    const unregisterUncaughtRejections = registerToUncaughtRejections(sendLog);
    const unregisterConsoleErrors = registerToConsoleMessages(
        sendLog,
        onWorkerLoggerLog,
    );

    return () => {
        unregisterUncaughtRejections();
        unregisterConsoleErrors();
    };
};

const getConfigurationBaseUrl = (wixSdk) => {
    const viewMode = wixSdk.window.viewMode;
    // when we are in an iframe instead of web worker for SEO flows
    // and headless browsers, we should be relative to the iframe url,
    // which looks like https://<guid>.pub.wix-code.com
    if (viewMode !== 'Site' || typeof window !== 'undefined') {
        if (
            typeof window !== 'undefined' &&
            typeof window._virtualConsole !== 'undefined'
        ) {
            // testing environment is using node-fetch which must use absolute urls
            const location = window.location.href;
            return location.substring(0, location.length - 1);
        }
        return '';
    }

    return wixSdk.location.baseUrl;
};

const init = async ({
    appLogger,
    fedopsLogger,
    wixSdk,
    instance,
    onLog: onWorkerLoggerLog,
    ignoredConsoleMessages,
}) => {
    try {
        const inSsrMode =
            get_(wixSdk, ['window', 'rendering', 'env']) === 'backend';
        // We do not support SSR since it lacks a proper fetch polyfill
        // Specifically, ky uses FetchResponse.clone() which is not yet supported
        if (inSsrMode) {
            return;
        }

        const {
            metaSiteId
        } = getDecodedInstance(instance);

        if (!metaSiteId) {
            // can happen in a new site which is not saved yet
            return;
        }

        const {
            createLogEntry
        } = createLogEntryFactory({
            wixSdk,
            metaSiteId,
            ignoredConsoleMessages,
        });

        const configurationService = createConfigurationService({
            appLogger,
            fedopsLogger,
            baseUrl: getConfigurationBaseUrl(wixSdk),
            metaSiteId,
            instance,
        });

        const configurationPromise = configurationService.fetchConfiguration();

        const {
            sendLogThrottled
        } = throttledLogSender({
            appLogger,
        });

        const _sendLog = async ({
            message,
            severity,
            sourceLocation
        }) => {
            // Log creation must be sync for an accurate timestamp
            const log = createLogEntry({
                message,
                severity,
                sourceLocation,
            });

            if (log) {
                const configuration = await configurationPromise;

                if (configuration.hasSinks) {
                    sendLogThrottled(log);
                }
            }
        };

        const unregisterListeners = registerListeners({
            sendLog: _sendLog,
            onWorkerLoggerLog,
        });

        const configuration = await configurationPromise;
        if (!configuration.hasSinks) {
            unregisterListeners();
        }
    } catch (e) {
        appLogger.error(e);
    }
};

module.exports = {
    init,
};