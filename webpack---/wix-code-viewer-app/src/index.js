const {
    create: createApp
} = require('./app');
const {
    logger: createAppLogger
} = require('./logger');

const appLogger = createAppLogger();

module.exports = createApp({
    appLogger,
    userConsole: console,
});