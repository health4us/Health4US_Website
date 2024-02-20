import {
    assert
} from '../..';
import {
    withValidation
} from '../../validations';
const ariaHiddenSDKFactory = ({
    setProps,
    props
}) => ({
    get hidden() {
        return props.ariaAttributes ? .hidden;
    },
    set hidden(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                hidden: assert.isNil(value) ? undefined : value,
            },
        });
    },
});
export const createAriaHiddenSDK = withValidation(ariaHiddenSDKFactory, {
    type: ['object'],
    properties: {
        hidden: {
            type: ['boolean'],
        },
    },
});
//# sourceMappingURL=ariaHiddenSDKFactory.js.map