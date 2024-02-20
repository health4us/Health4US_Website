module.exports.create = function(timeout = -1, maxBatchSize = -1) {
    const _queues = {};
    const listeners = [];

    function add(data, namespace) {
        const q = _queues[namespace] || {
            data: []
        };
        _queues[namespace] = q;

        clearTimeout(q.timeout);

        q.data.push(data);

        if (
            (maxBatchSize < 0 && timeout < 0) ||
            (maxBatchSize >= 0 && q.data.length >= maxBatchSize)
        ) {
            _drainQueue(namespace);
        } else if (timeout >= 0) {
            q.timeout = setTimeout(() => {
                _drainQueue(namespace);
            }, timeout);
        }
    }

    function onData(cb) {
        listeners.push(cb);
    }

    function _drainQueue(namespace) {
        const q = _queues[namespace] || {
            data: []
        };
        delete _queues[namespace];
        listeners.forEach((cb) => cb(q.data, namespace));
    }

    return {
        add,
        onData,
    };
};