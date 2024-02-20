import {
    withValidation
} from '../..';
import {
    createTextElementValidator
} from './accessibilityUtils/validators';
const describedBySDKFactory = ({
    setProps,
    props,
    create$w
}) => ({
    get describedBy() {
        if (!props.ariaAttributes ? .describedBy) {
            return undefined;
        }
        const $w = create$w();
        return $w(`#${props.ariaAttributes.describedBy}`);
    },
    set describedBy(selector) {
        if (!selector) {
            setProps({
                ariaAttributes: {
                    ...props.ariaAttributes,
                    describedBy: undefined,
                },
            });
            return;
        }
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                describedBy: selector.uniqueId,
            },
        });
    },
});
const customRules = {
    describedBy: [createTextElementValidator('describedBy')],
};
export const createDescribedBySDK = withValidation(describedBySDKFactory, {
    type: ['object'],
    properties: {
        describedBy: {
            type: ['object', 'nil'],
        },
    },
}, customRules);
//# sourceMappingURL=describedBySDKFactory.js.map