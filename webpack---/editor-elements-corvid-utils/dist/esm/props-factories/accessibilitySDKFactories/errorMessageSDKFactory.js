import {
    withValidation
} from '../..';
import {
    createTextElementValidator
} from './accessibilityUtils/validators';
const errorMessageSDKFactory = ({
    setProps,
    props,
    create$w
}) => ({
    get errorMessage() {
        if (!props.ariaAttributes ? .errorMessage) {
            return undefined;
        }
        const $w = create$w();
        return $w(`#${props.ariaAttributes.errorMessage}`);
    },
    set errorMessage(selector) {
        if (!selector) {
            setProps({
                ariaAttributes: {
                    ...props.ariaAttributes,
                    errorMessage: undefined,
                },
            });
            return;
        }
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                errorMessage: selector.uniqueId,
            },
        });
    },
});
const customRules = {
    errorMessage: [createTextElementValidator('errorMessage')],
};
export const createErrorMessageSDK = withValidation(errorMessageSDKFactory, {
    type: ['object'],
    properties: {
        errorMessage: {
            type: ['object', 'nil'],
        },
    },
}, customRules);
//# sourceMappingURL=errorMessageSDKFactory.js.map