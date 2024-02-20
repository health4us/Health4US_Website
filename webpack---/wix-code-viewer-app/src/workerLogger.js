const isError_ = require('lodash/isError');

const {
    wixCodeLogLevel
} = require('./wixCodeLogLevel');
const {
    callbackRegistrar
} = require('./callbackRegistrar');

const consoleMethodsToWrap = {
    info: wixCodeLogLevel.INFO,
    warn: wixCodeLogLevel.WARN,
    error: wixCodeLogLevel.ERROR,
    log: wixCodeLogLevel.LOG,
    debug: wixCodeLogLevel.DEBUG,
    assert: wixCodeLogLevel.ASSERT,
    dir: wixCodeLogLevel.DIR,
    table: wixCodeLogLevel.TABLE,
    trace: wixCodeLogLevel.TRACE,
};

const consoleTraversalDepthExclusive = 5;
const consoleTraversalDepthInclusive = 6;

function _normalizeCollection(collection, seen, depth) {
    if (depth > consoleTraversalDepthInclusive) {
        return collection instanceof Map ?
            '[Map]' :
            collection instanceof Set ?
            '[Set]' :
            '[Array]';
    }
    if (collection instanceof Map) {
        const clone = ['[Map]'];
        collection.forEach((v, k) =>
            clone.push([_normalize(k, seen, depth), _normalize(v, seen, depth)]),
        );
        return clone;
    }
    if (collection instanceof Set) {
        const clone = ['[Set]'];
        collection.forEach((v) => clone.push(_normalize(v, seen, depth)));
        return clone;
    }
    // it is "arguments" or a real array
    return Array.prototype.map.call(collection, (v) =>
        _normalize(v, seen, depth),
    );
}

function _normalize(v, seen, depth) {
    if (v === null || v === undefined) {
        return v;
    }

    if (
        v instanceof Error ||
        v instanceof Date ||
        typeof v === 'symbol' ||
        typeof v === 'function'
    ) {
        return v.toString();
    }

    if (Array.isArray(v) || v instanceof Map || v instanceof Set) {
        if (seen.includes(v)) {
            return '[Circular]';
        }
        seen.push(v);
        const arrClone = _normalizeCollection(v, seen, depth + 1);
        seen.pop();
        return arrClone;
    }

    if (typeof v.then === 'function') {
        return `Promise<>`;
    }

    if (typeof v === 'object') {
        if (depth > consoleTraversalDepthExclusive) {
            return '[Object]';
        }
        if (v.type && typeof v.type === 'string' && v.type.indexOf('$w.') === 0) {
            return v.id ? `$w('#${v.id}')` : `$w('${v.type.substr(3)}')`;
        }
        seen.push(v);
        const vClone = Object.keys(v).reduce((clone, key) => {
            const memberValue = v[key];
            if (seen.includes(memberValue)) {
                clone[key] = '[Circular]';
            } else {
                clone[key] = _normalize(memberValue, seen, depth + 1);
            }
            return clone;
        }, {});
        seen.pop();
        return vClone;
    }

    return v;
}

function wrapConsoleMethod(consoleInstance, logLevel, originalFunc, onLog) {
    return function() {
        const stack = isError_(arguments[0]) ?
            arguments[0].stack :
            new Error().stack;
        const args = _normalizeCollection(arguments, [], 0);
        const messageData = {
            logLevel,
            args,
            stack,
        };
        onLog(messageData);
        originalFunc.apply(consoleInstance, arguments);
    };
}

function wrapConsole(consoleInstance) {
    const {
        register: onLog,
        call: callOnLogListeners
    } = callbackRegistrar();

    if (consoleInstance) {
        const originalLog = consoleInstance.log || (() => {});
        for (const method in consoleMethodsToWrap) {
            if (
                consoleMethodsToWrap.hasOwnProperty(method) &&
                consoleInstance.hasOwnProperty(method)
            ) {
                const consoleMethodAlternative = wrapConsoleMethod(
                    consoleInstance,
                    consoleMethodsToWrap[method],
                    consoleInstance[method],
                    callOnLogListeners,
                );

                consoleInstance[method] = consoleMethodAlternative;
            }
        }
        const verboseMethodAlternative = wrapConsoleMethod(
            consoleInstance,
            wixCodeLogLevel.VERBOSE,
            originalLog,
            callOnLogListeners,
        );
        consoleInstance.verbose = verboseMethodAlternative;
    }

    return onLog;
}

function getMessageFromErrorObject(error) {
    return error.message || error.name;
}

function handlePromiseRejections() {
    const onUnhandledRejection = (callback) => {
        const listener = (event) => {
            const {
                reason
            } = event;
            const error = typeof reason === 'object' ? reason : {
                message: reason
            };

            callback({
                args: [getMessageFromErrorObject(error)],
                logLevel: 'ERROR',
                stack: error.stack,
            });
        };
        self.addEventListener('unhandledrejection', listener);
    };
    return onUnhandledRejection;
}

module.exports = {
    wrapConsole,
    handlePromiseRejections,
};