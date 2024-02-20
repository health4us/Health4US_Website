import {
    withValidation
} from '../../validations';
import {
    createElementValidator
} from './accessibilityUtils/validators';
const controlsSDKFactory = ({
    setProps,
    props,
    create$w
}) => ({
    get controls() {
        if (!props.ariaAttributes ? .controls) {
            return undefined;
        }
        const $w = create$w();
        return $w(`#${props.ariaAttributes.controls}`);
    },
    set controls(selector) {
        if (!selector) {
            setProps({
                ariaAttributes: {
                    ...props.ariaAttributes,
                    controls: undefined,
                },
            });
            return;
        }
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                controls: selector.uniqueId,
            },
        });
    },
});
const customRules = {
    controls: [createElementValidator('controls')],
};
export const createControlsSDK = withValidation(controlsSDKFactory, {
    type: ['object'],
    properties: {
        controls: {
            type: ['object', 'nil'],
        },
    },
}, customRules);
//# sourceMappingURL=controlsSDKFactory.js.map