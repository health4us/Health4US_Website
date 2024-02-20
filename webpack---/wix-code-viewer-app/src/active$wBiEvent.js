const isFunction_ = require('lodash/isFunction');
const biEventCreators = require('./logger/biEventCreators');

const active$wBiFactoryCreator = ({
    appLogger,
    platformBi = {}
}) => {
    const {
        isPopup,
        isServerSide,
        networkPageLoadStart,
        pageId,
        pageNumber,
        pageUrl,
        viewMode,
        viewerName,
    } = platformBi;

    let biWasSent = false;

    const wrappedObjects = new WeakMap();
    const MAX_TRAVERSING_DEPTH = 2;

    const shouldSendBi = () =>
        !isServerSide && !biWasSent && viewerName === 'thunderbolt';

    const sendBiEvent = () => {
        if (!shouldSendBi()) {
            return;
        }

        const tsn = networkPageLoadStart ?
            Date.now() - Math.round(networkPageLoadStart) :
            null;
        const eventObj =
            viewMode === 'site' ?
            biEventCreators.active$wSiteViewMode({
                isPopup,
                isServerSide,
                pageId,
                pageNumber,
                pageUrl,
                tsn,
            }) :
            biEventCreators.active$wPreviewMode({
                pageNumber,
                pageUrl,
                tsn,
                pageId,
            });

        appLogger.bi(eventObj);
        biWasSent = true;
    };

    const wrapFuncWithBi = (func) => {
        return function(...args) {
            sendBiEvent();
            return func.apply(this, args);
        };
    };

    const wrapObjectWithBiCallback = (obj, depth = 0) => {
        if (depth === 0 || !(obj instanceof Object) || wrappedObjects.has(obj)) {
            return obj;
        }

        wrappedObjects.set(obj, true);

        const propDescriptors = Object.getOwnPropertyDescriptors(obj);
        for (const descriptor in propDescriptors) {
            const propDescriptor = propDescriptors[descriptor];
            if (!propDescriptor.configurable) {
                continue;
            }
            if (descriptor === 'constructor') {
                // do nothing
            } else if (propDescriptor.set || propDescriptor.get) {
                Object.defineProperty(obj, descriptor, {
                    configurable: true,
                    get: propDescriptor.get ?
                        wrapFunctionReturnValueWithBi(propDescriptor.get) :
                        undefined,
                    set: propDescriptor.set ?
                        wrapFuncWithBi(propDescriptor.set) :
                        undefined,
                });
            } else if (isFunction_(propDescriptor.value)) {
                Object.defineProperty(obj, descriptor, {
                    configurable: true,
                    value: wrapFuncWithBi(propDescriptor.value),
                });
            } else if (
                Object.prototype.toString.call(propDescriptor.value) ===
                '[object Object]'
            ) {
                Object.defineProperty(obj, descriptor, {
                    configurable: true,
                    value: wrapObjectWithBiCallback(propDescriptor.value, depth - 1),
                });
            }
        }

        return obj;
    };

    const wrapFunctionReturnValueWithBi = function(func) {
        if (!shouldSendBi()) {
            return func;
        }

        const newFunc = function(...args) {
            if (!shouldSendBi()) {
                return func.apply(this, args);
            }
            return wrapObjectWithBiCallback(
                func.apply(this, args),
                MAX_TRAVERSING_DEPTH,
            );
        };

        // If the function object has additional properties(like $w.onReady), copy them as well
        for (const [key, value] of Object.entries(func)) {
            newFunc[key] = value;
        }

        return newFunc;
    };

    const wrapObjectPropertiesWithBi = (obj) => {
        if (!shouldSendBi()) {
            return obj;
        }

        return wrapObjectWithBiCallback(obj, MAX_TRAVERSING_DEPTH);
    };

    const wrapFunctionCallWithBi = (func) => {
        return shouldSendBi() ? wrapFuncWithBi(func) : func;
    };

    return {
        wrapObjectPropertiesWithBi,
        wrapFunctionReturnValueWithBi,
        wrapFunctionCallWithBi,
    };
};

module.exports = {
    active$wBiFactoryCreator
};