const ky = require('ky').default;
const valvelet = require('valvelet');
const DBBQ = require('./dbbq');
const {
    TelemetryLogSendError,
} = require('./logger/errors/telemetryLogSendError');

const throttledLogSender = ({
    appLogger,
    requestLimit = 1,
    requestInterval = 1000,
    logsPerBatch = 10,
    batchDrainTimeout = 500,
}) => {
    const sendRequest = (logs) => {
        const url = '/wix-code-telemetry-collector/v1/telemetry-messages';
        ky.post(url, {
            json: {
                messages: logs
            }
        }).catch((e) =>
            appLogger.error(new TelemetryLogSendError(e, logs)),
        );
        // TODO:  break down logs in case of network issue?
    };

    const batchedLogsQueue = DBBQ.create(batchDrainTimeout, logsPerBatch);
    const sendLogThrottled = (log) => batchedLogsQueue.add(log);

    const throttledSendRequest = valvelet(
        sendRequest,
        requestLimit,
        requestInterval,
        10000, // queue size
    );
    batchedLogsQueue.onData((logs) => throttledSendRequest(logs));

    return {
        sendLogThrottled,
    };
};

module.exports.throttledLogSender = throttledLogSender;