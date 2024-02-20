const {
    create: createLogger
} = require('@wix/wix-code-client-logger');
const {
    ravenHandlerCreator
} = require('./ravenHandler');
const {
    biHandlerCreator
} = require('./biHandler');
const {
    systemTracingHandlerCreator
} = require('./systemTracingHandler');

const viewerLogger = ({
    consoleHandler
}) => {
    const ravenHandler = ravenHandlerCreator();

    const systemTracingHandler = systemTracingHandlerCreator();

    const biHandler = biHandlerCreator();

    const logger = createLogger({
        handlerCreators: [
            consoleHandler,
            ravenHandler,
            systemTracingHandler,
            biHandler,
        ],
    });

    return logger;
};

module.exports.loggerCreator = viewerLogger;