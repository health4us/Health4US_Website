const {
    buildNamespacesMap
} = require('@wix/wix-code-viewer-utils');

const createGlobals = ({
    active$wBiFactory,
    $w,
    wixSdk,
    userConsole,
    getAppDefIdFromPackageName,
}) => {
    const wrapped$w = active$wBiFactory.wrapFunctionReturnValueWithBi($w);
    wrapped$w.at = active$wBiFactory.wrapFunctionCallWithBi($w.at, $w);

    const wrappedWixSdk = buildNamespacesMap(
        wixSdk,
        self.fetch.bind(self),
        active$wBiFactory.wrapObjectPropertiesWithBi,
    );

    return {
        $w: wrapped$w,
        $ns: wrappedWixSdk,
        console: userConsole,
        elementorySupport: wixSdk.elementorySupport,
        getAppDefIdFromPackageName, // corresponding change in the bundling side can be found here: https://github.com/wix-private/cloud-runtime/pull/4025
    };
};

module.exports = {
    createGlobals,
};