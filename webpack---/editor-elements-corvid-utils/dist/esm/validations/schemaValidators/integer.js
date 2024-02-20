import {
    ValidationResult,
} from '../createSchemaValidator';
import {
    assert
} from '../../assert';
import {
    messages
} from '../../messages';
export function validateInteger(value, schema, reportError, messageParams) {
    const {
        minimum,
        maximum,
        enum: enumArray
    } = schema;
    if (!assert.isInteger(value)) {
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
    if ((assert.isNumber(minimum) && assert.isBelow(value, minimum)) ||
        (assert.isNumber(maximum) && assert.isAbove(value, maximum))) {
        reportError(messages.invalidNumberBoundsMessage({
            value,
            minimum: minimum,
            maximum,
            ...messageParams,
        }), { ...messageParams,
            value
        });
        return ValidationResult.Invalid;
    }
    return ValidationResult.Valid;
}
//# sourceMappingURL=integer.js.map