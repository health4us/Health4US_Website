const {
    isLocalhost
} = require('@wix/dbsm-common/src/worker/getUrl');
const {
    loggerCreator
} = require('./viewerLogger');
const {
    consoleHandlerCreator
} = require('@wix/wix-code-client-logger');
const {
    id: systemTracingId
} = require('./systemTracingHandler');

const traceHandlerIds = {
    SYSTEM_TRACING: systemTracingId,
};

const loggerWithHandlers = () => {
    const {
        consoleHandler
    } = consoleHandlerCreator({
        shouldLog: isLocalhost,
    });

    return loggerCreator({
        consoleHandler,
    });
};

module.exports.logger = loggerWithHandlers;
module.exports.traceHandlerIds = traceHandlerIds;