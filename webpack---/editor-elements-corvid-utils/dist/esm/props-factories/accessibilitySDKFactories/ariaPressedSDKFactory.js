import {
    assert
} from '../..';
import {
    withValidation
} from '../../validations';
const ariaPressedSDKFactory = ({
    setProps,
    props
}) => ({
    get pressed() {
        return props.ariaAttributes ? .pressed;
    },
    set pressed(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                pressed: assert.isNil(value) ? undefined : value,
            },
        });
    },
});
export const createAriaPressedSDK = withValidation(ariaPressedSDKFactory, {
    type: ['object'],
    properties: {
        pressed: {
            type: ['string'],
            enum: ['false', 'true', 'mixed'],
        },
    },
});
//# sourceMappingURL=ariaPressedSDKFactory.js.map