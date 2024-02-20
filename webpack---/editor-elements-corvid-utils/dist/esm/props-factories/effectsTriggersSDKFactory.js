import {
    reportError
} from '../reporters';
import {
    messageTemplates
} from '../messages';
const validateEffects = (possibleEffects, effects, functionName) => {
    const invalidEffects = effects.filter(name => !possibleEffects.includes(name));
    if (invalidEffects.length) {
        reportError(messageTemplates.error_effects_input({
            functionName,
            wrongEffects: invalidEffects,
            allowedEffects: possibleEffects,
        }));
    }
};
export const effectsTriggersSDKFactory = api => {
    const getEffects = () => api.effectsTriggersApi ? .getEffects() || [];
    return {
        effects: {
            get effects() {
                return getEffects();
            },
            get activeEffects() {
                return api.effectsTriggersApi ? .getActiveEffects() || [];
            },
            applyEffects: effects => {
                validateEffects(getEffects(), effects, 'applyEffects');
                api.effectsTriggersApi ? .applyEffects(...effects);
            },
            removeEffects: effects => {
                validateEffects(getEffects(), effects, 'removeEffects');
                api.effectsTriggersApi ? .removeEffects(...effects);
            },
            toggleEffects: effects => {
                validateEffects(getEffects(), effects, 'toggleEffects');
                api.effectsTriggersApi ? .toggleEffects(...effects);
            },
            removeAllEffects: () => api.effectsTriggersApi ? .removeAllEffects(),
        },
    };
};
//# sourceMappingURL=effectsTriggersSDKFactory.js.map