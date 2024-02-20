import {
    ValidationResult,
} from '../createSchemaValidator';
import {
    assert
} from '../../assert';
import {
    messages
} from '../../messages';
export function validateString(value, schema, reportError, messageParams) {
    const {
        minLength,
        maxLength,
        enum: enumArray,
        pattern
    } = schema;
    if (!assert.isString(value)) {
        return ValidationResult.InvalidType;
    }
    if (enumArray && !assert.isIn(value, enumArray)) {
        reportError(messages.invalidEnumValueMessage({
            value,
            enum: enumArray,
            ...messageParams,
        }), { ...messageParams,
            value
        });
        return ValidationResult.Invalid;
    }
    if ((minLength && assert.isBelow(value.length, minLength)) ||
        (maxLength && assert.isAbove(value.length, maxLength))) {
        reportError(messages.invalidStringLengthMessage({
            value,
            minimum: minLength,
            maximum: maxLength,
            ...messageParams,
        }), { ...messageParams,
            value
        });
        return ValidationResult.Invalid;
    }
    if (pattern && !new RegExp(pattern).test(value)) {
        reportError(messages.patternMismatchMessage({
            value,
            ...messageParams,
        }), { ...messageParams,
            value
        });
        return ValidationResult.Invalid;
    }
    return ValidationResult.Valid;
}
//# sourceMappingURL=string.js.map