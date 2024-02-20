import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const roleDescriptionSDKFactory = ({
    setProps,
    props
}) => ({
    get roleDescription() {
        return props.ariaAttributes ? .roleDescription;
    },
    set roleDescription(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                roleDescription: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createRoleDescriptionSDK = withValidation(roleDescriptionSDKFactory, {
    type: ['object'],
    properties: {
        roleDescription: {
            type: ['string'],
            minLength: 1,
            maxLength: 100,
        },
    },
});
//# sourceMappingURL=roleDescriptionSDKFactory.js.map