'use strict';

const notifier = require('../utils/notifier');
const fs = require('fs');
const url = require('url');
const util = require('../utils/worker');
const cfg = require('../config.json');
const reports = require('../services/report');

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

    return;
}

function processScreenshots(err, job) {

    if (err) {
        notifier.error('Error while job running: ', err); process.exit(500);
    }

    saveJob(job.job_id);

    util.pollScreenshotWorker(browserstack.screenshotClient, job, function(err, isRunning) {
        if (!err && !isRunning) {
            // this is highly dependent on demand and queue time at BrowserStack;
            // little point in stalling the test run waiting for this job to complete

            // print warning in console for user to decide
            notifier.warning("Worker "+ job.job_id +" did not run within timeout"); return;
        }

        browserstack.screenshotClient.getJob(job.job_id, generateReport);
    });

}

function generateReport(err, job) {
    if (err) {
        notifier.error('Error while job running: ', error); process.exit(500);
    }

    notifier.info('Downloading screenshots for report, please wait...');

    var
        domainName = url.parse(job.screenshots[0].url),

        reportDest = cfg.reportsPath + "screenshots_browserstack" +
                     domainName.hostname.split('.')[0] + "_" +
                     notifier.now("DD-MM-YYYY-hh-mm") + ".pdf",

        document = {
            template: fs.readFileSync('./templates/screenshots-browserstack-report.hbs', 'utf8'),
            path: reportDest, context: job
        };

    job.generatedAt = notifier.now("DD/MM/YYYY hh:mm:ss");
    job.domain = domainName;

    reports

        .create(document)

        .then(function(res) {
            notifier.info("Report saved to path: ", res.filename);
            notifier.info("Command excecuted.");
            process.exit(200); //success
        })

        .catch(function(error) {
            notifier.error("Error while report saving: ", error); process.exit(500);
        });

    return;
}

function saveJob(id){
    var toFile = JSON.stringify({
        date: notifier.now('DD/MM/YYYY hh.mm.ss'),
        id: id
    }) + '\n';

    fs.appendFileSync(cfg.jobsPath, toFile, 'utf8');
}