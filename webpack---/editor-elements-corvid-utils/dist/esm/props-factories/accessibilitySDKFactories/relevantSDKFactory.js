import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const relevantSDKFactory = ({
    setProps,
    props
}) => ({
    get relevant() {
        return props.ariaAttributes ? .relevant;
    },
    set relevant(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                relevant: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createRelevantSDK = withValidation(relevantSDKFactory, {
    type: ['object'],
    properties: {
        relevant: {
            type: ['string'],
            enum: ['additions', 'additions text', 'all', 'removals', 'text'],
        },
    },
});
//# sourceMappingURL=relevantSDKFactory.js.map