const isWebWorker = () => {
    return (
        typeof WorkerGlobalScope !== 'undefined' &&
        self instanceof WorkerGlobalScope // eslint-disable-line no-undef
    );
};

module.exports.isWebWorker = isWebWorker;