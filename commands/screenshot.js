'use strict';

const notifier = require('../utils/notifier');
const fs = require('fs');
const util = require('../utils/worker');
const cfg = require("../config.json");

module.exports = {

    'init': init

};

var browserstack = undefined;

function init(app, bs) {

    browserstack = bs;

    app

        .command('screenshots [URL]')

        .description('Get site screenshots, paltforms and browsers should be placed to "browsers.json" config file')

        .action(cmdHandler)
    ;

};


function cmdHandler(url) {

    if (!url) {
        notifier.error('URL parameter not passed'); process.exit(1);
    }

    var regex = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);

    if (!url.match(regex)) {
        notifier.error('Incorrect URL passed.'); process.exit(1);
    }

    notifier.info('Parsing testing browsers data.');
    {
        var browsersList = require("../browsers.json");

        if (!browsersList || browsersList.length === 0) {
            notifier.error('Browsers list not passed, please check "browser.json" file'); process.exit(1);
        }

        notifier.info('Data parsed.');
    }


    notifier.info('Generating screenshots, please wait...');
    {
        browserstack.screenshotClient
            .generateScreenshots({ url: url, browsers: browsersList }, processScreenshots);
    }

}

function processScreenshots(err, job) {
    if (error) {
        notifier.error('Error while job running: ', err);
    }

    util.pollScreenshotWorker(browserstack.screenshotClient, job, function(err, isRunning) {
        if (!err && !isRunning) {
            // this is highly dependent on demand and queue time at BrowserStack;
            // little point in stalling the test run waiting for this job to complete

            // print warning in console for user to decide
            notifier.warning("Worker "+ job.job_id +" did not run within timeout");
        }

        browserstack.screenshotClient.getJob(job.job_id, function(err, job) {
            if (err) {
                notifier.error('Error while job running: ', error);
            }

        });

    });
}