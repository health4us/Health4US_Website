import {
    composeSDKFactories
} from '../composeSDKFactories';
import {
    createAriaLabelSDK,
    createAtomicSDK,
    createBusySDK,
    createCurrentSDK,
    createDescribedBySDK,
    createErrorMessageSDK,
    createExpandedSDK,
    createLabelledBySDK,
    createLiveSDK,
    createOwnsSDK,
    createRelevantSDK,
    createRoleSDK,
    screenReaderSDKFactory,
    createTabIndexSDK,
    createControlsSDK,
    createRoleDescriptionSDK,
    createAriaHiddenSDK,
    createAriaPressedSDK,
    createAriaHaspopupSDK,
} from './accessibilitySDKFactories';
const ariaFactoryMap = {
    enableAriaLabel: createAriaLabelSDK,
    enableAriaDescribedBy: createDescribedBySDK,
    enableAriaLabelledBy: createLabelledBySDK,
    enableAriaAtomic: createAtomicSDK,
    enableAriaBusy: createBusySDK,
    enableAriaCurrent: createCurrentSDK,
    enableAriaExpanded: createExpandedSDK,
    enableAriaLive: createLiveSDK,
    enableAriaOwns: createOwnsSDK,
    enableAriaControls: createControlsSDK,
    enableAriaRoleDescription: createRoleDescriptionSDK,
    enableAriaRelevant: createRelevantSDK,
    enableAriaErrorMessage: createErrorMessageSDK,
    enableAriaHidden: createAriaHiddenSDK,
    enableAriaPressed: createAriaPressedSDK,
    enableAriaHaspopup: createAriaHaspopupSDK,
};
const accessibilityFactoryMap = {
    enableScreenReader: screenReaderSDKFactory,
    enableRole: createRoleSDK,
    enableTabIndex: createTabIndexSDK,
};
const createAriaAttributesSDKFactory = (ariaAttributeOptions) => {
    const sdkFactories = [];
    Object.entries(ariaAttributeOptions).forEach(([option, enabled]) => enabled &&
        ariaFactoryMap[option] &&
        sdkFactories.push(ariaFactoryMap[option]));
    return api => {
        const factory = composeSDKFactories(sdkFactories, {
            modifyAriaSourceKeys: true,
        })(api);
        /**
         * @deprecated Should not be used, keeping only for backward compatibility
         */
        factory.ariaAttributes = composeSDKFactories(sdkFactories)(api);
        return factory;
    };
};
export const createAccessibilityPropSDKFactory = ({
    enableAriaLabel = true,
    enableAriaDescribedBy = true,
    enableAriaLabelledBy = true,
    enableAriaAtomic = false,
    enableAriaBusy = false,
    enableAriaHidden = false,
    enableAriaPressed = false,
    enableAriaHaspopup = false,
    enableAriaCurrent = false,
    enableAriaExpanded = false,
    enableAriaLive = false,
    enableAriaOwns = false,
    enableAriaControls = false,
    enableAriaRoleDescription = false,
    enableAriaRelevant = false,
    enableRole = false,
    enableTabIndex = false,
    enableAriaErrorMessage = false,
    enableScreenReader = false,
} = {}) => api => {
    const sdkFactories = [];
    const ariaAttributesOptions = {
        enableAriaLabel,
        enableAriaDescribedBy,
        enableAriaLabelledBy,
        enableAriaAtomic,
        enableAriaBusy,
        enableAriaCurrent,
        enableAriaExpanded,
        enableAriaLive,
        enableAriaOwns,
        enableAriaControls,
        enableAriaRoleDescription,
        enableAriaRelevant,
        enableAriaErrorMessage,
        enableAriaHidden,
        enableAriaPressed,
        enableAriaHaspopup,
    };
    const otherAccessibilityOptions = {
        enableScreenReader,
        enableRole,
        enableTabIndex,
    };
    const enableAriaAttributes = Object.values(ariaAttributesOptions).some(optionEnabled => optionEnabled);
    if (enableAriaAttributes) {
        const ariaAttributesSDKFactory = createAriaAttributesSDKFactory(ariaAttributesOptions);
        sdkFactories.push(ariaAttributesSDKFactory);
    }
    Object.entries(otherAccessibilityOptions).forEach(([option, enabled]) => enabled &&
        accessibilityFactoryMap[option] &&
        sdkFactories.push(accessibilityFactoryMap[option]));
    const accessibilitySdkFactory = composeSDKFactories(sdkFactories);
    return {
        accessibility: accessibilitySdkFactory(api)
    };
};
//# sourceMappingURL=accessibilityPropsSDKFactory.js.map