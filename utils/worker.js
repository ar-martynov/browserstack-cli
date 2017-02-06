'use strict';

const extend = require('../api/extend');
const notifier = require('../utils/notifier');

var pollWorkerRetries = 30;
var pollWorkerRetryInterval = 5000;

var encoding = process.env.TRAVIS ? "base64" : "utf8";
module.exports.browserStack = {
    username: new Buffer(process.env.BROWSERSTACK_USERNAME || "", encoding).toString(),
    password: new Buffer(process.env.BROWSERSTACK_KEY || "", encoding).toString()
};

module.exports.terminateWorkers = function terminateWorkers(client, workers, callback) {
    if (!workers.length) {
        return callback(null);
    }

    if (workers[0].id) {
        workers = workers.map(function(w) {
            return w.id;
        });
    }

    client.terminateWorker(workers.shift(), function() {
        if (!workers.length) {
            return callback(null);
        }

        terminateWorkers(client, workers, callback);
    });
};

module.exports.pollApiWorker = function pollApiWorker(client, worker, callback) {
    pollWorker(worker,
        client.getWorker.bind(client),
        function getWorkerId(worker) {
            return worker && worker.id;
        },
        function isWorkerRunning(worker) {
            return worker && worker.status === "running";
        }, callback);
};

module.exports.pollScreenshotWorker = function pollScreenshotWorker(client, worker, callback) {
    pollWorker(worker,
        client.getJob.bind(client),
        function getWorkerId(worker) {
            return worker && (worker.job_id || worker.id);
        },
        function isWorkerRunning(worker) {
            return worker && worker.state === "done";
        }, callback);
};

module.exports.merge = function merge(o, a) {
    return extend(extend({}, o), a);
};

function pollWorker(worker, getWorkerStatusFn, getWorkerIdFn, isWorkerRunningFn, callback) {
    var maxRetries = pollWorkerRetries;
    var retryInterval = pollWorkerRetryInterval;
    var workerId = getWorkerIdFn(worker);
    var timer;

    var pollWorkerState = function(id, callback) {
        if (--maxRetries < 1) {
            clearTimeout(timer);
            return callback(null, false);
        }

        getWorkerStatusFn(workerId, function(err, worker) {
            workerId = getWorkerIdFn(worker);

            if (err || !workerId) {
                clearTimeout(timer);
                return callback(err, false);
            }

            if (isWorkerRunningFn(worker)) {
                return callback(null, true);
            }

            setTimeout(function() {
                notifier.info("Awaiting screenshots job ending, please wait...");
                pollWorkerState(id, callback);
            }, retryInterval);
        });
    };

    pollWorkerState(workerId, callback);
}