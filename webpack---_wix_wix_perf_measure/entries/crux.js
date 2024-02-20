// @ts-check
import observe from '../utils/observe.js';
import {
    getPn
} from './pages.js';
import {
    entryType as lcpEntryType,
    lcpFromWebVitals,
    lcpResult,
} from './lcp.js';
import cls from './cls.js';

const entryType = 'crux';

let cwvFuncs;

/**
 * Compute LCP and CLS as close as possible to CrUX
 * @param {import('../utils/utils.js').State} state
 * @param {Promise<{startTime: number}>} visibility
 */
export default function crux(state, visibility) {
    const [, , PerformanceObserver] = state;

    let lcpFound;
    let lcpPromise = Promise.resolve({});

    function update(entries) {
        if (entries ? .length) {
            [lcpFound] = entries.slice(-1);
            lcpPromise = lcpResult(
                /** @type {import('./lcp.js').LargestContentfulPaint} */
                (lcpFound),
            ).then((result) => ({
                // Add lcpOld as it was previously reported by perf-measure
                ...result,
                lcpOld: result.lcp,
            }));
        }
    }

    const observer = observe(PerformanceObserver, lcpEntryType, update);

    cwvFuncs = {
        cls: () => cls(state, true),
        lcp: () => {
            update(observer ? .takeRecords ? .());
            return lcpFound;
        },
    };
    // We want to call lcpFromWebVitals right away, without waiting for visibility,
    // otherwise onLCP might contain defective entries
    return Promise.all([visibility, lcpFromWebVitals()]).then(
        ([{
            startTime
        }, newLcp]) => {
            return lcpPromise.then((lcpValue) => {
                const clsValue = cls(state);
                return {
                    ...clsValue,
                    // Add new LCP value only once (rather than on every observer update)
                    ...lcpValue,
                    ...newLcp,
                    entryType,
                    startTime,
                    pn: getPn(),
                };
            });
        },
    );
}

export function getCurrentLcp() {
    return lcpResult(cwvFuncs ? .lcp());
}

/**
 * @template T
 * @param {T} target
 * @returns {T}
 */
export function addGetters(target) {
    /** @type {PropertyDescriptorMap} */
    const map = {};
    addProp('lcp');
    addProp('cls');
    return Object.defineProperties(target, map);

    function addProp(prop) {
        map[prop] = {
            value: () => cwvFuncs ? .[prop]() ? .element,
        };
    }
}