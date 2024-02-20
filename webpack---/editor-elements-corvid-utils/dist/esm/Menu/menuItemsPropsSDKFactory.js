import {
    assert
} from '../assert';
import {
    messages
} from '../messages';
import {
    withValidation
} from '../validations';
import {
    reportError,
    reportWarning
} from '../reporters';
import {
    composeSanitizers,
    emptyStringIfNotString,
    numberToString,
} from '../inputUtils';
const valueSanitizer = composeSanitizers([
    numberToString,
    emptyStringIfNotString,
]);
const externalRegex = /^(http|https):\/\/(.*)/;
const pageUrlRegex = /^\/([^ ?#]*)[?]?(.*)/;
const isExternalPage = (url) => externalRegex.test(url);
const isPageUrl = (url) => pageUrlRegex.test(url);
const _menuPropsSDKFactory = ({
    setProps,
    props,
    platformUtils: {
        linkUtils
    },
    sdkData,
}) => {
    const getPageTitleFromUrl = (url, pageList) => {
        const key = url.slice(1);
        if (pageList.hasOwnProperty(key)) {
            return pageList[key].title;
        } else {
            return '';
        }
    };
    const removeInvalidLevels = (items) => {
        if (!assert.isNil(items)) {
            items.forEach(topItem => {
                if (!assert.isNil(topItem.items)) {
                    topItem.items.forEach(subItem => (subItem.items = []));
                }
            });
        }
    };
    const convertSdkDataItemsToModelFormat = (items) => {
        if (assert.isNil(items)) {
            return items;
        }
        return items.map((menuItem) => convertSdkDataItemToModelFormat(menuItem));
    };
    const convertSdkDataItemToModelFormat = (menuItem) => {
        const menuItemModelFormat = {
            label: '',
            link: undefined,
        };
        const target = isExternalPage(menuItem.link) ? '_blank' : '_self';
        const link = linkUtils.getLinkProps(menuItem.link, target);
        if (link) {
            // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
            // @ts-ignore TODO: Fix type for getLink after types merge in TB
            menuItemModelFormat.link = link;
        }
        if (menuItem.label) {
            menuItemModelFormat.label = menuItem.label;
        } else if (menuItem.link && isPageUrl(menuItem.link)) {
            menuItemModelFormat.label = getPageTitleFromUrl(menuItem.link, sdkData.pageList);
        } else {
            reportWarning('The label parameter that is passed to the set items method cannot be set to null or undefined.');
        }
        if (assert.isBoolean(menuItem.visibleOnDesktop)) {
            menuItemModelFormat.isVisible = menuItem.visibleOnDesktop;
        }
        if (assert.isBoolean(menuItem.visibleOnMobile)) {
            menuItemModelFormat.isVisibleMobile = menuItem.visibleOnMobile;
        }
        if (assert.isArray(menuItem.items)) {
            if (menuItem.items.length) {
                menuItemModelFormat.items = convertSdkDataItemsToModelFormat(menuItem.items);
            } else {
                menuItemModelFormat.items = [];
            }
        }
        if (assert.isNumber(menuItem.displayCount)) {
            menuItemModelFormat.displayCount = menuItem.displayCount;
        }
        const menuItemDefaults = {
            isVisible: true,
            isVisibleMobile: true,
            items: [],
        };
        return { ...menuItemDefaults,
            ...menuItemModelFormat
        };
    };
    const convertSdkOptionsToModelFormat = (options) => {
        if (assert.isNil(options)) {
            return options;
        }
        return options.map(option => convertSdkOptionToModelFormat(option));
    };
    const convertSdkOptionToModelFormat = (option) => {
        const menuItemModelFormat = {
            text: '',
            link: undefined,
            key: '',
            value: '',
        };
        const target = isExternalPage(option.link) ? '_blank' : '_self';
        const link = linkUtils.getLinkProps(option.link, target);
        if (link) {
            menuItemModelFormat.link = link;
        }
        if (option.label) {
            menuItemModelFormat.text = option.label;
        }
        if (option.value) {
            menuItemModelFormat.value = option.value;
            menuItemModelFormat.key = option.value;
        } else {
            reportWarning('The value parameter that is passed to the set options method cannot be set to null or undefined.');
        }
        return menuItemModelFormat;
    };
    const convertModelDataItemsToSdkFormat = (items) => {
        return assert.isNil(items) ?
            items :
            items.map(modelItem => convertModelDataItemToSdkFormat(modelItem));
    };
    const convertModelDataItemToSdkFormat = (item) => {
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore TODO: Fix type for getLink after types merge in TB
        const link = item.link ? linkUtils.getLink(item.link) : '';
        const items = item.items ?
            convertModelDataItemsToSdkFormat(item.items) :
            [];
        const visibleOnDesktop = assert.isNil(item.isVisible) ?
            true :
            item.isVisible;
        const visibleOnMobile = assert.isNil(item.isVisibleMobile) ?
            true :
            item.isVisibleMobile;
        const {
            label,
            displayCount
        } = item;
        return {
            label,
            displayCount,
            items,
            link,
            visibleOnDesktop,
            visibleOnMobile,
        };
    };
    const convertModelOptionsToSdkFormat = (options) => {
        return assert.isNil(options) ?
            options :
            options.map(option => convertModelOptionToSdkFormat(option));
    };
    const convertModelOptionToSdkFormat = (option) => {
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore TODO: Fix type for getLink after types merge in TB
        const link = option.link ? linkUtils.getLink(option.link) : '';
        const {
            text,
            value
        } = option;
        return {
            label: text,
            value,
            link,
        };
    };
    return {
        get items() {
            return convertModelDataItemsToSdkFormat(props.items);
        },
        set items(value) {
            try {
                removeInvalidLevels(value);
                setProps({
                    items: convertSdkDataItemsToModelFormat(value),
                });
            } catch (e) {
                if (!assert.isNil(e.name) && e.name === 'UnsupportedLinkTypeError') {
                    reportError(`A link property that is passed to the link method cannot be set to that value, as this is not a supported link type.`);
                }
            }
        },
        get options() {
            return convertModelOptionsToSdkFormat(props.options);
        },
        set options(value) {
            try {
                setProps({
                    options: convertSdkOptionsToModelFormat(value),
                });
            } catch (e) {
                if (!assert.isNil(e.name) && e.name === 'UnsupportedLinkTypeError') {
                    reportError(`A link property that is passed to the link method cannot be set to that value, as this is not a supported link type.`);
                }
            }
        },
        get type() {
            return '$w.Menu';
        },
        get value() {
            let value = '';
            if (props.options) {
                const isCurrentValueInOptions = props.options.some(option => option.value === props.value);
                if (isCurrentValueInOptions) {
                    value = props.value;
                }
            }
            return value;
        },
        set value(value) {
            const sanitizedValue = valueSanitizer(value);
            if (props.options) {
                const isValueInOptions = props.options.some(option => option.value === sanitizedValue);
                setProps({
                    value: isValueInOptions ? sanitizedValue : ''
                });
            }
        },
        get autoNavigation() {
            // We used to allow auto navigation - which was implemented by a feature which has been removed
            return false;
        },
    };
};
export const menuPropsSDKFactory = withValidation(_menuPropsSDKFactory, {
    type: ['object'],
    properties: {
        items: {
            type: ['array', 'nil'],
            warnIfNil: true,
        },
        options: {
            type: ['array', 'nil'],
            warnIfNil: true,
            items: {
                type: ['object'],
                properties: {
                    value: {
                        type: ['string', 'nil'],
                        minLength: 0,
                        maxLength: 400,
                    },
                    label: {
                        type: ['string', 'nil'],
                        minLength: 0,
                        maxLength: 400,
                    },
                },
            },
        },
    },
}, {
    items: [
        (value) => {
            const isValid = typeof value === 'undefined' || assert.isArray(value);
            if (!isValid) {
                reportError(messages.invalidTypeMessage({
                    value,
                    types: ['array', 'undefined'],
                    propertyName: 'items',
                    functionName: 'set items',
                    index: undefined,
                }));
            }
            return isValid;
        },
    ],
    options: [
        (value) => {
            const isValid = typeof value === 'undefined' || assert.isArray(value);
            if (!isValid) {
                reportError(messages.invalidTypeMessage({
                    value,
                    types: ['array', 'undefined'],
                    propertyName: 'options',
                    functionName: 'set options',
                    index: undefined,
                }));
            }
            return isValid;
        },
    ],
    value: [
        (value) => {
            const sanitizedValue = valueSanitizer(value);
            const isValid = typeof value === 'undefined' || assert.isString(sanitizedValue);
            if (!isValid) {
                reportError(messages.invalidTypeMessage({
                    value,
                    types: ['string', 'undefined'],
                    propertyName: 'value',
                    functionName: 'set value',
                    index: undefined,
                }));
            }
            return isValid;
        },
    ],
});
//# sourceMappingURL=menuItemsPropsSDKFactory.js.map