const {
    logLevels: developerConsoleLogLevels,
} = require('@wix/santa-core-utils/dist/cjs/coreUtils/core/logWixCodeConsoleMessage');

const wixCodeLogLevel = {
    INFO: 'INFO',
    WARN: 'WARNING',
    ERROR: 'ERROR',
    LOG: 'LOG',
    VERBOSE: 'VERBOSE',
    DEBUG: 'DEBUG',
    ASSERT: 'ASSERT',
    DIR: 'DIR',
    TABLE: 'TABLE',
    TRACE: 'TRACE',
};

const siteMonitoringSeverity = {
    DEFAULT: 'DEFAULT',
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
};

const logLevelToSiteMonitoringMapping = {
    [wixCodeLogLevel.INFO]: siteMonitoringSeverity.INFO,
    [wixCodeLogLevel.WARN]: siteMonitoringSeverity.WARNING,
    [wixCodeLogLevel.ERROR]: siteMonitoringSeverity.ERROR,
    [wixCodeLogLevel.LOG]: siteMonitoringSeverity.INFO,
    [wixCodeLogLevel.VERBOSE]: siteMonitoringSeverity.DEBUG,
    [wixCodeLogLevel.DEBUG]: siteMonitoringSeverity.DEBUG,
    [wixCodeLogLevel.ASSERT]: siteMonitoringSeverity.ERROR,
    [wixCodeLogLevel.DIR]: siteMonitoringSeverity.INFO,
    [wixCodeLogLevel.TABLE]: siteMonitoringSeverity.INFO,
    [wixCodeLogLevel.TRACE]: siteMonitoringSeverity.INFO,
};

const logLevelToDeveloperConsoleMapping = {
    [wixCodeLogLevel.INFO]: developerConsoleLogLevels.INFO,
    [wixCodeLogLevel.WARN]: developerConsoleLogLevels.WARNING,
    [wixCodeLogLevel.ERROR]: developerConsoleLogLevels.ERROR,
    [wixCodeLogLevel.LOG]: developerConsoleLogLevels.LOG,
    [wixCodeLogLevel.VERBOSE]: developerConsoleLogLevels.VERBOSE,
    [wixCodeLogLevel.DEBUG]: developerConsoleLogLevels.LOG,
    [wixCodeLogLevel.ASSERT]: developerConsoleLogLevels.ERROR,
    [wixCodeLogLevel.DIR]: developerConsoleLogLevels.LOG,
    [wixCodeLogLevel.TABLE]: developerConsoleLogLevels.LOG,
    [wixCodeLogLevel.TRACE]: developerConsoleLogLevels.LOG,
};

const convertToSiteMonitoringSeverity = (logLevel) =>
    logLevelToSiteMonitoringMapping[logLevel];
const convertToDeveloperConsoleSeverity = (logLevel) =>
    logLevelToDeveloperConsoleMapping[logLevel];

module.exports.wixCodeLogLevel = wixCodeLogLevel;
module.exports.siteMonitoringSeverity = siteMonitoringSeverity;
module.exports.convertToSiteMonitoringSeverity =
    convertToSiteMonitoringSeverity;
module.exports.convertToDeveloperConsoleSeverity =
    convertToDeveloperConsoleSeverity;