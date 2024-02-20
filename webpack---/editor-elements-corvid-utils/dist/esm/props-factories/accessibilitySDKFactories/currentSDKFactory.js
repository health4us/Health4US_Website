import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const currentSDKFactory = ({
    setProps,
    props
}) => ({
    get current() {
        return props.ariaAttributes ? .current;
    },
    set current(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                current: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createCurrentSDK = withValidation(currentSDKFactory, {
    type: ['object'],
    properties: {
        current: {
            type: ['string'],
            enum: ['step', 'page', 'true', 'false', 'location', 'date', 'time'],
        },
    },
});
//# sourceMappingURL=currentSDKFactory.js.map