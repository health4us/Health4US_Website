import {
    withValidation
} from '../../validations';
import {
    isEmptyValue
} from './accessibilityUtils/assertions';
const expandedSDKFactory = ({
    setProps,
    props
}) => ({
    get expanded() {
        return props.ariaAttributes ? .expanded;
    },
    set expanded(value) {
        setProps({
            ariaAttributes: {
                ...props.ariaAttributes,
                expanded: isEmptyValue(value) ? undefined : value,
            },
        });
    },
});
export const createExpandedSDK = withValidation(expandedSDKFactory, {
    type: ['object'],
    properties: {
        expanded: {
            type: ['boolean'],
        },
    },
});
//# sourceMappingURL=expandedSDKFactory.js.map