import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const busySDKFactory = ({
    setProps,
    props
}) => ({
    get busy() {
        return props.ariaAttributes ? .busy;
    },
    set busy(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                busy: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createBusySDK = withValidation(busySDKFactory, {
    type: ['object'],
    properties: {
        busy: {
            type: ['boolean'],
        },
    },
});
//# sourceMappingURL=busySDKFactory.js.map