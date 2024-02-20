import {
    withValidation
} from '../..';
import {
    createTextElementValidator
} from './accessibilityUtils/validators';
const labelledBySDKFactory = ({
    setProps,
    props,
    create$w
}) => ({
    get labelledBy() {
        if (!props.ariaAttributes ? .labelledBy) {
            return undefined;
        }
        const $w = create$w();
        return $w(`#${props.ariaAttributes.labelledBy}`);
    },
    set labelledBy(selector) {
        if (!selector) {
            setProps({
                ariaAttributes: {
                    ...props.ariaAttributes,
                    labelledBy: undefined,
                },
            });
            return;
        }
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                labelledBy: selector.uniqueId,
            },
        });
    },
});
const customRules = {
    labelledBy: [createTextElementValidator('labelledBy')],
};
export const createLabelledBySDK = withValidation(labelledBySDKFactory, {
    type: ['object'],
    properties: {
        labelledBy: {
            type: ['object', 'nil'],
        },
    },
}, customRules);
//# sourceMappingURL=labelledBySDKFactory.js.map