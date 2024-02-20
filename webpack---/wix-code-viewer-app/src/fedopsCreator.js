const createFedopsLogger = (fedopsLoggerFactory) => {
    const wixCodeAppDefId = '675bbcef-18d8-41f5-800e-131ec9e08762';

    return fedopsLoggerFactory.getLoggerForWidget({
        appId: wixCodeAppDefId,
        appName: wixCodeAppDefId,
    });
};

module.exports = {
    createFedopsLogger
};