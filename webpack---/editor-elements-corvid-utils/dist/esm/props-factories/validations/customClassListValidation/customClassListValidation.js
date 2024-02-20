import {
    reportError
} from '../../../reporters';
import {
    messageTemplates
} from '../../../messages';
export const isValidClassName = (className, functionName) => {
    const classNameRegex = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/;
    if (typeof className !== 'string') {
        handleTypeError(className, functionName, 'className', 'string');
        return false;
    } else if (!classNameRegex.test(className)) {
        handleUnsupportedChars(className, functionName);
        return false;
    }
    return true;
};
export const handleTypeError = (propertyName, functionName, value, expectedType) => {
    reportError(messageTemplates.error_type({
        propertyName,
        functionName,
        value,
        expectedType,
    }));
};
export const handleMandatoryVals = (propertyNames, functionName) => {
    reportError(messageTemplates.error_mandatory_multiple_vals({
        propertyNames,
        functionName,
    }));
};
export const handleMandatorySingleVal = (propertyName, functionName) => {
    reportError(messageTemplates.error_mandatory_val({
        propertyName,
        functionName,
    }));
};
export const handleUnsupportedChars = (propertyName, functionName) => {
    reportError(messageTemplates.error_unsupported_chars({
        propertyName,
        functionName,
    }));
};
//# sourceMappingURL=customClassListValidation.js.map