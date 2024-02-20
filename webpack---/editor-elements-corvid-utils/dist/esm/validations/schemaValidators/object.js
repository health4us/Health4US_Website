import {
    ValidationResult,
} from '../createSchemaValidator';
import {
    assert
} from '../../assert';
import {
    messages
} from '../../messages';
const hasOwnProperty = Object.prototype.hasOwnProperty;
const getOwnPropertyNames = Object.getOwnPropertyNames;
const noop = () => {};
export function validateObject(value, schema, validateSchema, reportError, reportWarning, messageParams) {
    if (!assert.isObject(value)) {
        return ValidationResult.InvalidType;
    }
    if (schema.oneOf) {
        return schema.oneOf
            .map(variant => validateObject(value, variant, validateSchema, noop, reportWarning, messageParams))
            .filter(validity => validity === ValidationResult.Valid).length === 1 ?
            ValidationResult.Valid :
            ValidationResult.Invalid;
    }
    if (schema.required) {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let propNameIdx = 0; propNameIdx < schema.required.length; propNameIdx++) {
            if (!hasOwnProperty.call(value, schema.required[propNameIdx])) {
                reportError(messages.missingFieldMessage({
                    functionName: messageParams.functionName,
                    index: messageParams.index,
                    propertyName: schema.required[propNameIdx],
                }), { ...messageParams,
                    value
                });
                return ValidationResult.Invalid;
            }
        }
    }
    const propNames = getOwnPropertyNames(schema.properties ? ? {});
    if (schema.additionalProperties === false) {
        const invalidPropertyNames = getOwnPropertyNames(value).filter(key => !propNames.includes(key));
        if (invalidPropertyNames.length) {
            const message = messages.unknownFieldMessage({
                functionName: messageParams.functionName,
                index: messageParams.index,
                propertyNames: invalidPropertyNames,
            });
            reportError(message);
            return ValidationResult.Invalid;
        }
    }
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let propNameIdx = 0; propNameIdx < propNames.length; propNameIdx++) {
        const propName = propNames[propNameIdx];
        if (hasOwnProperty.call(value, propName)) {
            const propSchema = schema.properties[propName];
            const propValue = value[propName]; // hmmm...
            if (!validateSchema(propValue, propSchema, {
                    functionName: messageParams.functionName,
                    index: messageParams.index,
                    propertyName: propName,
                })) {
                return ValidationResult.Invalid;
            }
        }
    }
    return ValidationResult.Valid;
}
//# sourceMappingURL=object.js.map