import {
    assert
} from '../../assert';
const sanitizeItem = (item) => Object.entries(item).reduce((acc, [key, value]) => {
    if (assert.isNil(value)) {
        return acc;
    } else if (!assert.isDate(value)) {
        if (assert.isObject(value)) {
            return {
                ...acc,
                [key]: sanitizeItem(value),
            };
        } else if (assert.isArray(value)) {
            return {
                ...acc,
                [key]: value.map(sanitizeItem),
            };
        }
    }
    return { ...acc,
        [key]: value
    };
}, {});
/**
 * All validations should be handled by
 * schema validator, so every value should be valid
 */
export const transformPropDataToSdkData = (menuDataItem) => sanitizeItem({
    label: menuDataItem.label,
    link: menuDataItem.link ? .href,
    selected: menuDataItem.selected,
    target: menuDataItem.link ? .target,
    id: menuDataItem._id,
    menuItems: menuDataItem.items ? .map(transformPropDataToSdkData),
});
/**
 * All validations should be handled by
 * schema validator, so every value should be valid
 */
export const transformSdkDataToPropData = (sdkMenuItem) => sanitizeItem({
    label: sdkMenuItem.label || '',
    link: {
        href: sdkMenuItem.link,
        target: sdkMenuItem.target,
    },
    isVisible: true,
    isVisibleMobile: true,
    selected: sdkMenuItem.selected,
    _id: sdkMenuItem.id,
    items: sdkMenuItem.menuItems ? .map(transformSdkDataToPropData),
});
//# sourceMappingURL=transformers.js.map