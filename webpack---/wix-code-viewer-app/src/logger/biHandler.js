const {
    union
} = require('@wix/wix-code-adt');
const {
    matchAny
} = require('@wix/wix-code-client-logger');
const {
    BI_SOURCE,
    BI_ENDPOINT: BI_VIEWER_ENDPOIINT_PREVIEW,
    BI_VIEWER_ENDPOINT: BI_VIEWER_ENDPOINT_LIVE,
} = require('@wix/dbsm-common/src/bi/constants');

const getEndpointByViewMode = (viewMode) =>
    viewMode !== 'Site' ? BI_VIEWER_ENDPOIINT_PREVIEW : BI_VIEWER_ENDPOINT_LIVE;

const Environment = union('Environment', {
    NotInitialized() {},
    Initialized({
        viewMode,
        biLoggerFactory
    }) {
        const biLogger = biLoggerFactory()
            .updateDefaults({
                src: BI_SOURCE
            })
            .logger({
                endpoint: getEndpointByViewMode(viewMode),
            });

        return {
            biLogger
        };
    },
});

const biHandlerCreator = () => {
    let environment = Environment.NotInitialized();

    const biHandler = () => ({
        init: ({
            viewMode,
            biLoggerFactory
        }) => {
            // this "if" can be removed once we get rid of the legacy app
            if (biLoggerFactory) {
                environment = Environment.Initialized({
                    viewMode,
                    biLoggerFactory
                });
            }
        },
        log: (logEvent) => {
            logEvent.matchWith({
                BI: ({
                    biEvent
                }) => {
                    environment.matchWith({
                        Initialized: ({
                            biLogger
                        }) => {
                            biLogger.log(biEvent, {
                                useBatch: false
                            });
                        },
                        NotInitialized: () => {
                            throw new Error(
                                `You cannot report to BI before setting the logger environment.
                  Make sure you call logger.init before reporting.`,
                            );
                        },
                    });
                },
                [matchAny]: () => {},
            });
        },
    });

    return biHandler;
};

module.exports.biHandlerCreator = biHandlerCreator;