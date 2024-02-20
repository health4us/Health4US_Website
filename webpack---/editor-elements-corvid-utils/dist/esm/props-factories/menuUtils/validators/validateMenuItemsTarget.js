import {
    reportError
} from '../../../reporters';
import {
    InvalidTargetError
} from '../errors';
export const validateMenuItemsTarget = (value) => {
    if (!value) {
        return true;
    }
    const checkMenuItemsTarget = (items, parentIndex) => items ? .every(({
        target,
        link = '',
        label = link,
        menuItems
    }, index) => {
        if (target != null && target !== '_blank' && target !== '_self') {
            throw new InvalidTargetError({
                index: parentIndex === undefined ? index : parentIndex,
                label,
                target,
            });
        }
        return checkMenuItemsTarget(menuItems, index);
    }) ? ? true;
    try {
        return checkMenuItemsTarget(value);
    } catch (error) {
        reportError(error.message);
        return false;
    }
};
//# sourceMappingURL=validateMenuItemsTarget.js.map