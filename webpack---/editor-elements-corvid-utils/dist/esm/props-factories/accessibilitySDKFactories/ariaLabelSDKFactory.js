import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const ariaLabelSDKFactory = ({
    setProps,
    props
}) => ({
    get label() {
        return props.ariaAttributes ? .label;
    },
    set label(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                label: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createAriaLabelSDK = withValidation(ariaLabelSDKFactory, {
    type: ['object'],
    properties: {
        label: {
            type: ['string'],
            minLength: 1,
            maxLength: 1000,
        },
    },
});
//# sourceMappingURL=ariaLabelSDKFactory.js.map