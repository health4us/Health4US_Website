import {
    assert
} from '../assert';
const removeLineBreaksRegex = /(\r\n|\n|\r)/gm;
const validFloatingPointNumberRegex = /^-?(\d+|\d+\.\d+|\.\d+)([eE][-+]?\d+)?$/;
export const numberToString = (value) => {
    return assert.isNumber(value) && isFinite(value) ? value.toString() : value;
};
export const emptyStringIfNotString = (value) => {
    return assert.isString(value) ? value : '';
};
export const removeLineBreaks = (value) => value.replace(removeLineBreaksRegex, '');
export const forceMaxLength = (maxLength) => (value) => maxLength ? value.substr(0, maxLength) : value;
export const removeLeadingAndTrailingWhitespace = (value) => value.trim();
export const validFloatingPointNumber = (value) => {
    return validFloatingPointNumberRegex.test(value) ? value : '';
};
export const normalizePrecision = (step) => (value) => {
    if (!value || !value.length || !step) {
        return value;
    }
    const normalizedStep = Number((Math.log(1 / step) / Math.log(10)).toFixed());
    return Number(value).toFixed(normalizedStep);
};
export const composeSanitizers = (sanitizers) => (value) => sanitizers.reduce((_value, sanitizer) => sanitizer(_value), value);
//# sourceMappingURL=inputSanitization.js.map