'use strict';

const notifier = require('../utils/notifier');
const fs = require('fs');
const url = require('url');
const util = require('../utils/worker');
const fileUtils = require('../utils/file');
const cfg = require('../config.json');
const reports = require('../services/report');

module.exports = {

    'init': init

};

var browserstack = undefined;
var domain = undefined;
var reportName = undefined;

function init(app, bs) {

    browserstack = bs;

    app

        .command('screenshots [URL]')

        .description('Get site screenshots, paltforms and browsers should be placed to "browsers.json" config file')

        .action(cmdHandler)
    ;

};

function cmdHandler(incomingUrl) {

    notifier.info('Parsing testing browsers data.');
    {
        var browsersList = cfg.browserstack.browsers;

        if (!browsersList || browsersList.length === 0) {
            notifier.error('Browsers list not passed, please check "browser.json" file'); process.exit(1);
        }

        notifier.info('Data parsed.');
    }

    notifier.info('Generating screenshots, please wait...');
    {
        domain = url.parse(incomingUrl);

        reportName = `screenshots_browserstack_${domain.hostname}_${notifier.now("DD-MM-YYYY-hh-mm")}`
            .replace('www.', '').replace(/\./g, '_');

        browserstack.screenshotClient.generateScreenshots({

            url: incomingUrl,
            local: cfg.browserstack.local,
            browsers: browsersList,
            mac_res: cfg.browserstack.resolutions.mac,
            win_res: cfg.browserstack.resolutions.win

        }, processScreenshots);
    }

    return;
}

function processScreenshots(err, job) {

    if (err) {
        notifier.error('Error while job running: ', err); process.exit(500);
    }

    saveJob(job);

    util.pollScreenshotWorker(browserstack.screenshotClient, job, function(err, isRunning) {
        if (!err && !isRunning) {
            // this is highly dependent on demand and queue time at BrowserStack;
            // little point in stalling the test run waiting for this job to complete

            // print warning in console for user to decide
            notifier.warning("Worker "+ job.job_id +" did not run within timeout");
        }

        browserstack.screenshotClient.getJob(job.job_id, generateReport);
    });

}

function generateReport(err, job) {
    if (err) {
        notifier.error('Error while job running: ', error); process.exit(500);
    }

    notifier.info('Downloading screenshots for report, please wait...');

    var document = {
        template: fs.readFileSync('./templates/screenshots-browserstack-report.hbs', 'utf8'),
        context: job
    };

    job.generatedAt = notifier.now("DD/MM/YYYY hh:mm:ss");
    job.domain = domain.hostname;

    var htmlReport = reports.compileHtml(document);
    {
        var reportDest = fileUtils.saveReportSync(reportName, htmlReport, handleError);
        notifier.info("Report saved to path: ", reportDest);
        notifier.info("Command excecuted.");
    }

    process.exit(0);
}

function saveJob(job){
    var toFile = JSON.stringify({
        type: 'browserstack',
        domain: domain.hostname,
        date: notifier.now('DD/MM/YYYY hh.mm.ss'),
        id: job.job_id
    }) + '\n';

    fs.appendFileSync(cfg.jobsPath, toFile, 'utf8');
}

function handleError(err) {
    notifier.error('Error fired by phantom.js: ', err);
}