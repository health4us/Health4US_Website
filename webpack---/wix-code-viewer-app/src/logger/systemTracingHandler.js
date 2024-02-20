const noop_ = require('lodash/noop');
const {
    union,
    Result
} = require('@wix/wix-code-adt');
const {
    matchAny
} = require('@wix/wix-code-client-logger');
const {
    filterByReportToHandlers
} = require('./filterByReportToHandlers');

const id = 'SYSTEM_TRACING';

const Environment = union('Environment', {
    NotInitialized() {},
    Initialized({
        reportTrace
    }) {
        return {
            reportTrace
        };
    },
});

function doTrace(reportTrace, params) {
    Result.try(() => reportTrace(params));
}

const systemTracingHandlerCreator = () => {
    let environment = Environment.NotInitialized();

    const systemTracingHandler = () => ({
        init: ({
            reportTrace
        }) => {
            environment = Environment.Initialized({
                reportTrace
            });
        },
        log: filterByReportToHandlers(id, (logEvent) => {
            environment.matchWith({
                Initialized: ({
                    reportTrace
                }) => {
                    logEvent.matchWith({
                        Trace: ({
                            payload: {
                                actionName
                            },
                            position
                        }) => {
                            position.matchWith({
                                Start: () =>
                                    doTrace(reportTrace, {
                                        actionName,
                                        tracePosition: 'before'
                                    }),
                                End: ({
                                        durationMs: actionDurationMs
                                    }) =>
                                    doTrace(reportTrace, {
                                        actionName,
                                        tracePosition: 'after',
                                        actionDurationMs,
                                    }),
                                [matchAny]: noop_,
                            });
                        },
                        [matchAny]: noop_,
                    });
                },
                NotInitialized: () => {
                    throw new Error(
                        `You cannot report to system tracer before setting the logger environment.
              Make sure you call logger.init before reporting.`,
                    );
                },
            });
        }),
    });

    return systemTracingHandler;
};

module.exports.id = id;
module.exports.systemTracingHandlerCreator = systemTracingHandlerCreator;