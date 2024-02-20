export const keyCodes = {
    enter: 13,
    space: 32,
    end: 35,
    home: 36,
    escape: 27,
    arrowLeft: 37,
    arrowUp: 38,
    arrowRight: 39,
    arrowDown: 40,
    tab: 9,
    delete: 46,
    a: 65,
    z: 90,
    pageUp: 33,
    pageDown: 34,
};
// see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
export const keys = {
    space: ['Spacebar', ' '],
    enter: ['Enter'],
};

function activateByKey(key) {
    return event => {
        if (event.keyCode === key) {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.click();
        }
    };
}
export const activateBySpaceButton = activateByKey(keyCodes.space);
export const activateByEnterButton = activateByKey(keyCodes.enter);
export const activateBySpaceOrEnterButton = event => {
    activateByEnterButton(event);
    activateBySpaceButton(event);
};
export const activateByEscapeButton = activateByKey(keyCodes.escape);
export const HAS_CUSTOM_FOCUS_CLASSNAME = 'has-custom-focus';
export const getAriaAttributes = ({
    pressed,
    expanded,
    haspopup,
    label,
    live,
    relevant,
    current,
    owns,
    controls,
    roleDescription,
    hidden,
    disabled,
    describedBy,
    labelledBy,
    errorMessage,
    atomic,
    role,
    busy,
    ...ariaProps
} = {}) => {
    const tabIndex = ariaProps.tabIndex ? ? ariaProps.tabindex;
    const finalAriaAttributes = {};
    if (label) {
        finalAriaAttributes['aria-label'] = label;
    }
    if (live) {
        finalAriaAttributes['aria-live'] = live;
    }
    if (current) {
        finalAriaAttributes['aria-current'] = current;
    }
    if (pressed) {
        finalAriaAttributes['aria-pressed'] = pressed;
    }
    if (typeof hidden === 'boolean') {
        finalAriaAttributes['aria-hidden'] = hidden;
    }
    if (typeof expanded === 'boolean') {
        finalAriaAttributes['aria-expanded'] = expanded;
    }
    if (typeof disabled === 'boolean') {
        finalAriaAttributes['aria-disabled'] = disabled;
    }
    if (typeof atomic === 'boolean') {
        finalAriaAttributes['aria-atomic'] = atomic;
    }
    if (typeof busy === 'boolean') {
        finalAriaAttributes['aria-busy'] = busy;
    }
    if (typeof relevant === 'string') {
        finalAriaAttributes['aria-relevant'] = relevant;
    }
    if (typeof owns === 'string') {
        finalAriaAttributes['aria-owns'] = owns;
    }
    if (typeof controls === 'string') {
        finalAriaAttributes['aria-controls'] = controls;
    }
    if (typeof roleDescription === 'string') {
        finalAriaAttributes['aria-roledescription'] = roleDescription;
    }
    if (haspopup) {
        finalAriaAttributes['aria-haspopup'] = haspopup;
    }
    if (typeof tabIndex === 'number') {
        finalAriaAttributes.tabIndex = tabIndex;
    }
    if (role) {
        finalAriaAttributes.role = role;
    }
    if (describedBy) {
        finalAriaAttributes['aria-describedby'] = describedBy;
    }
    if (labelledBy) {
        finalAriaAttributes['aria-labelledby'] = labelledBy;
    }
    if (errorMessage) {
        finalAriaAttributes['aria-errormessage'] = errorMessage;
    }
    return finalAriaAttributes;
};
export const getTabIndexAttribute = (a11y = {}) => {
    const tabIndex = a11y.tabIndex ? ? a11y.tabindex ? ? undefined;
    return tabIndex !== undefined ? {
        tabIndex: Number(tabIndex)
    } : {};
};
//# sourceMappingURL=a11y.js.map