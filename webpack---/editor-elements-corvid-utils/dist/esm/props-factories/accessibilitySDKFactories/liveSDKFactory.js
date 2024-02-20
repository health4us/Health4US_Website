import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const liveSDKFactory = ({
    setProps,
    props
}) => ({
    get live() {
        return props.ariaAttributes ? .live;
    },
    set live(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                live: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createLiveSDK = withValidation(liveSDKFactory, {
    type: ['object'],
    properties: {
        live: {
            type: ['string'],
            enum: ['polite', 'assertive'],
        },
    },
});
//# sourceMappingURL=liveSDKFactory.js.map