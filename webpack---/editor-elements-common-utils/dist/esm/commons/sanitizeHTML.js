import {
    default as xss,
    whiteList as externalXSSWhitelist,
    safeAttrValue,
    getDefaultCSSWhiteList,
} from 'xss';
const ALLOWED_PREFIX_ATTRIBUTES = ['data', 'aria'];
const ALLOWED_ATTRIBUTES = [
    'style',
    'class',
    'dir',
    'wix-comp',
    'role',
    'tabindex',
    'focus',
    'start',
];
const ALLOWED_LINK_ATTRIBUTES = ['href', 'dataquery', 'id', 'rel', 'target'];
const CSS_PROPS_WHITELIST = [
    'color',
    'background-color',
    'font-size',
    'font-family',
    'font-style',
    'text-decoration',
    'writing-mode',
    'text-orientation',
    'line-height',
    'text-shadow',
    'direction',
    'position',
    'z-index',
    'top',
    'left',
    'overflow',
    'overflow-x',
    'overflow-y',
];

function generateHTMLWhiteList() {
    const whitelist = {
        ...externalXSSWhitelist,
        strike: [],
        hatul: [],
        wline: [],
        object: [],
    };
    if (whitelist.a) {
        whitelist.a.push(...ALLOWED_LINK_ATTRIBUTES);
    }
    Object.keys(whitelist).forEach((key) => {
        if (!whitelist[key]) {
            whitelist[key] = [];
        }
        whitelist[key].push(...ALLOWED_ATTRIBUTES);
    });
    return whitelist;
}

function getSafeAttrValue(tag, name, value, cssFilter) {
    if (tag === 'a' && name === 'href') {
        if (value.startsWith('wix:document')) {
            return value;
        }
    }
    return safeAttrValue(tag, name, value, cssFilter);
}

function generateCSSWhiteList() {
    return CSS_PROPS_WHITELIST.reduce((acc, key) => {
        acc[key] = true;
        return acc;
    }, {});
}
const XSSWhitelist = generateHTMLWhiteList();
const CSSWhitelist = generateCSSWhiteList();
export function sanitizeHTML(html) {
    return xss(html, {
        whiteList: XSSWhitelist,
        stripIgnoreTagBody: ['script', 'style'],
        stripBlankChar: true,
        css: {
            whiteList: { ...getDefaultCSSWhiteList(),
                ...CSSWhitelist
            }
        },
        safeAttrValue: function onAttrValue(tag, name, value, cssFilter) {
            const attrValue = getSafeAttrValue(tag, name, value, cssFilter);
            return attrValue ? attrValue : '';
        },
        onIgnoreTagAttr(tag, name, value) {
            if (ALLOWED_PREFIX_ATTRIBUTES.some(prefix => name.startsWith(prefix))) {
                return `${name}="${value}"`;
            }
            return '';
        },
        onIgnoreTag() {
            return '';
        },
    });
}
//# sourceMappingURL=sanitizeHTML.js.map