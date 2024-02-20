const ERROR_NAME = 'NamespaceInitializationError';

class NamespaceInitializationError extends Error {
    constructor(namespace, reason) {
        super(
            `Failed to initialize namespace "${namespace}" with error: ${reason}`,
        );
        this.name = ERROR_NAME;
        this.namespace = namespace;
        this.reason = reason;
    }
}

module.exports.NamespaceInitializationError = NamespaceInitializationError;
module.exports.ERROR_NAME = ERROR_NAME;