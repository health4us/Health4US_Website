import {
    reportError
} from '../../../reporters';
import {
    InvalidIdPatternError,
    NonUniqueIdError
} from '../errors';
import {
    isString
} from '../../../assert';
const idPattern = /^[a-zA-Z\d-]*$/;
const validateIdPattern = (items, parentIndex) => {
    items ? .every(({
        id,
        link = '',
        label = link,
        menuItems
    }, index) => {
        if (id && !idPattern.test(id)) {
            throw new InvalidIdPatternError({
                index: parentIndex === undefined ? index : parentIndex,
                label,
                id,
            });
        }
        return validateIdPattern(menuItems, index);
    });
};
const validateIdUniqueness = (items) => {
    const ids = getItemIds(items || []);
    const duplicatedId = findDuplicate(ids);
    if (duplicatedId !== undefined) {
        throw new NonUniqueIdError({
            id: duplicatedId
        });
    }
};
const getItemIds = (menuItems) => {
    return menuItems.reduce((agg, curr) => {
        return [
            ...agg,
            ...(isString(curr.id) ? [curr.id] : []),
            ...(curr.menuItems ? getItemIds(curr.menuItems) : []),
        ];
    }, []);
};
const findDuplicate = (arr) => {
    return arr.find((value, idx) => {
        return idx !== arr.lastIndexOf(value);
    });
};
export const validateMenuItemsId = (menuItems) => {
    try {
        validateIdUniqueness(menuItems);
        validateIdPattern(menuItems);
    } catch (error) {
        reportError(error.message);
        return false;
    }
    return true;
};
//# sourceMappingURL=validateMenuItemsId.js.map