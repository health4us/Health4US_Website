import {
    withValidation
} from '../validations';
const _navigationButtonsSDKFactory = ({
    props,
    setProps
}) => {
    return {
        get showNavigationButtons() {
            return props.showNavigation;
        },
        set showNavigationButtons(val) {
            setProps({
                showNavigation: val,
            });
        },
    };
};
export const navigationButtonsSDKFactory = withValidation(_navigationButtonsSDKFactory, {
    type: ['object'],
    properties: {
        showNavigationButtons: {
            type: ['boolean']
        },
    },
});
//# sourceMappingURL=navigationButtonsSDKFactory.js.map