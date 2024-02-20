import {
    menuItemsPropsSDKFactory,
    createElementPropsSDKFactory,
    changePropsSDKFactory,
} from '../props-factories';
import {
    composeSDKFactories
} from '../composeSDKFactories';
import {
    menuPropsSDKFactory
} from './menuItemsPropsSDKFactory';
const elementPropsSDKFactory = createElementPropsSDKFactory();
export const sdk = composeSDKFactories([
    elementPropsSDKFactory,
    changePropsSDKFactory,
    menuPropsSDKFactory,
    menuItemsPropsSDKFactory,
]);
//# sourceMappingURL=Menu.corvid.js.map