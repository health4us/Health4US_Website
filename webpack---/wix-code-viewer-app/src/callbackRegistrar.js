const callbackRegistrar = () => {
    const listeners = [];

    function call(...args) {
        listeners.forEach((listenerFn) => listenerFn(...args));
    }

    function register(cb) {
        listeners.push(cb);

        return () => {
            const index = listeners.indexOf(cb);
            if (index >= 0) {
                listeners.splice(index, 1);
            }
        };
    }

    return {
        register,
        call
    };
};

module.exports.callbackRegistrar = callbackRegistrar;