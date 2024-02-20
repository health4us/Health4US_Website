const ERROR_NAME = 'LoadUserCodeError';

class LoadUserCodeError extends Error {
    constructor(originalError, url) {
        super(`Failed to import user code script: ${originalError.message}`);
        this.name = ERROR_NAME;
        this.originalError = originalError;
        this.url = url;
    }
}

module.exports.LoadUserCodeError = LoadUserCodeError;
module.exports.ERROR_NAME = ERROR_NAME;