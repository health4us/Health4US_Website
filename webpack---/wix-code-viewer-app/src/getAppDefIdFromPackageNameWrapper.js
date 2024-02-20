const find_ = require('lodash/find');
const {
    getBackendPackageNameFromImportName,
} = require('@wix/cloud-elementory-protocol');

const getAppDefIdFromPackageNameWrapper =
    (codePackagesData) => (packageName) => {
        const packageDataForGivenName = find_(
            codePackagesData,
            ({
                importName
            }) =>
            getBackendPackageNameFromImportName(importName) === packageName,
        );

        return packageDataForGivenName ? packageDataForGivenName.appDefId : null;
    };

module.exports = {
    getAppDefIdFromPackageNameWrapper,
};