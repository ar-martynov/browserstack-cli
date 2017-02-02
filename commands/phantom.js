'use strict';

const notifier = require('../utils/notifier');
const reports = require('../services/report');
const cfg = require('../config.json');
const fs = require('fs');
const url = require('url');
const phantom = require('phantom');
const path = require('path');


// settings for phantom.js cli
const phantomOpts = [

    '--ignore-ssl-errors=yes',
    '--load-images=yes'

];

const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) 
                   AppleWebKit/537.36 (KHTML, like Gecko) 
                   Chrome/55.0.2883.87 Safari/537.36`;

module.exports = {

    'init': init

};

var pageLink = undefined;
var pages = [];
var domain = undefined;
var phantomInstance = undefined;
var reportName = undefined;

var bootstrapJs = 'bootstrap.js';
var bootstrapCss = 'bootstrap.css';

function init(app) {

    app

        .command('phantom')

        .description(
            'Get site screenshots with phantom.js,resolutions should be placed to "browsers.json" config file'
        )

        .action(cmdHandler)
    ;

};

function cmdHandler(link) {

    if (!link) {
        notifier.error('URL parameter not passed');
        process.exit(1);
    }

    var regex = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);

    if (!link.match(regex)) {
        notifier.error('Incorrect URL passed.');
        process.exit(1);
    }

    pageLink = link;
    domain = url.parse(pageLink).hostname.replace('www.', '');
    reportName = `phantom_${domain}_${notifier.now("DD-MM-YYYY-hh-mm")}`;

    notifier.info(`Instantiating phantom.js with URL: ${link}`);

    phantom

        .create(phantomOpts)

        .then(scrapLinks)

        .then(processResult)

        .then(generateReport)

        .catch(handleError)
    ;
}

function scrapLinks(instance) {

    var tasks = [];

    if (phantomInstance) phantomInstance.exit();

    phantomInstance = instance;

    cfg.phantom.resolutions.forEach(resolution => tasks.push(
        instance.createPage().then(page => {

            var reportItem = {
                page: page,
                status: undefined,
                filename: `${domain}_${resolution.width}x${resolution.height}`,
                resolution: resolution,
                logs: {
                    messages: [],
                    jsErrors: [],
                    resourceErrors: []
                }
            };

            configurePage(reportItem);

            pages.push(reportItem);

            var task = page.open(pageLink);
            {
                task.then(result => reportItem.status = result);
            }

            return task;
        })
    ));

    // close phantom.js instance
    return Promise.all(tasks);
}

function processResult() {

    // fs screenshot tasks
    var tasks = [];

    // format result and generate screenshots
    pages.forEach(item => {

        if (item.status !== "success") {
            notifier.error(`Failed to load ${pageLink}, status: ${item.status}`);
            item.status = false;
            return;
        }

        var fullPath = path.normalize(`${cfg.reportsPath}${reportName}/screenshots/${item.filename}.jpg`);

        notifier.info(`${item.filename} loaded`);

        var screenshotTask = item.page.render(fullPath);
        {
            tasks.push(screenshotTask);
            screenshotTask.then((isSuccess) => {

                if (!isSuccess) {
                    notifier.error(`Error while "${fullPath}" saving`);
                    item.filename = undefined;
                    item.status = false;
                }

                notifier.info(`Screenshot saved "${fullPath}"`);
                {
                    item.filename = `./screenshots/${item.filename}.jpg`;
                    item.status = true;
                    item.page.close();
                    item.page = undefined;
                }
            });
        }
    });

    return Promise.all(tasks);
}

function generateReport() {
    if (phantomInstance) {
        phantomInstance.exit();
        phantomInstance = undefined;
    }

    notifier.info('All tasks completed, report generation started.');

    var libsPath = path.normalize(`${cfg.reportsPath}/${reportName}/libs/`);
    var reportDest = `${cfg.reportsPath}${reportName}/${reportName}.html`;

    var document = {
        template: fs.readFileSync('./templates/screenshots-phantom-report.hbs', 'utf8'),
        context: {
            screenshots: pages,
            domain: domain,
            generatedAt: notifier.now("DD/MM/YYYY hh:mm:ss")
        },
    };

    // write report to file
    fs.writeFile(reportDest, reports.compileHtml(document), (err) => {
        if (err) {
            return console.log(err);
        }

        // copy libs to path
        var src = path.normalize(`./templates/libs/${bootstrapJs}`);
        copyFile(src, libsPath, bootstrapJs);

        src = path.normalize(`./templates/libs/${bootstrapCss}`);
        copyFile(src, libsPath, bootstrapCss);

        notifier.info("Report saved!"); process.exit(0);
    });
}

function configurePage(opts) {

    var page = opts.page;
    var resolution = opts.resolution;
    var logs = opts.logs;

    page.property('userAgent', userAgent);
    page.property('viewportSize', resolution);

    page.on("onConsoleMessage", function (msg, lineNum, sourceId) {
        logs.messages.push(msg);
        notifier.warning(`Console message ${opts.filename}: "${msg}"`);
    });

    page.on("onResourceError", function (err) {
        logs.resourceErrors.push(err);
        notifier.error(`Unable to load resource (#${err.id} URL: ${err.url})`);
        notifier.error(`Error code: ${err.errorCode}. Description: ${err.errorString}`);
    });

    page.on("onError", function (msg, trace) {
        logs.jsErrors.push({msg: msg, trace: JSON.stringify(trace)});
        notifier.error(msg, trace)
    });

    notifier.info(`Trying to load address with ${resolution.width}x${resolution.height} resolution.`);
}

function handleError(err) {
    notifier.error('Error fired by phantom.js: ', err);
    {
        if (phantomInstance) {
            phantomInstance.exit();
            phantomInstance = undefined;
        }
    }
}


function copyFile(src, destFolder, destFilename) {
    var data = fs.readFileSync(src, 'utf8').toString();
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder);
    fs.writeFileSync(path.normalize(destFolder + destFilename),data);
}