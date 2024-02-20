const {
    matchAny
} = require('@wix/wix-code-client-logger');

const filterByReportToHandlers = (id, logFn) => (logEvent) => {
    logEvent.matchWith({
        Trace: ({
            payload
        }) => {
            if (payload.options.reportToHandlers.includes(id)) {
                logFn(logEvent);
            }
        },
        [matchAny]: () => logFn(logEvent),
    });
};

module.exports.filterByReportToHandlers = filterByReportToHandlers;