const safeGet = (fn, defaultValue) => {
    try {
        return fn();
    } catch (e) {
        return defaultValue;
    }
};

module.exports.safeGet = safeGet;