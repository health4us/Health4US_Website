import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const atomicSDKFactory = ({
    setProps,
    props
}) => ({
    get atomic() {
        return props.ariaAttributes ? .atomic;
    },
    set atomic(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                atomic: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createAtomicSDK = withValidation(atomicSDKFactory, {
    type: ['object'],
    properties: {
        atomic: {
            type: ['boolean'],
        },
    },
});
//# sourceMappingURL=atomicSDKFactory.js.map