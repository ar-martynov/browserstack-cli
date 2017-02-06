const path = require('path');
const fs = require('fs');
const cfg = require('../config.json');

const bootstrapJsName = 'bootstrap.js';
const bootstrapCssName = 'bootstrap.css';

const bootstrapJsPath = path.normalize(`./templates/libs/${bootstrapJsName}`);
const bootstrapCssPath = path.normalize(`./templates/libs/${bootstrapCssName}`);

module.exports = {
    saveReportSync: saveReportSync,
    copyFileSync: copyFileSync
}

function saveReportSync(reportName, textData, errCb) {

    var reportPath = path.normalize(`${cfg.reportsPath}/${reportName}`);
    var libsPath = `${reportPath}/libs/`;
    var reportDest = path.normalize(`${reportPath}/${reportName}.html`);

    if (!fs.existsSync(reportPath)){
        fs.mkdirSync(reportPath);
    }

    if (!fs.existsSync(libsPath)){
        fs.mkdirSync(libsPath);
    }

    // write report to file
    fs.writeFileSync(reportDest, textData, (err) => {
        if (err)
            return errCb(err);
    });

    copyFileSync(bootstrapJsPath, libsPath, bootstrapJsName);
    copyFileSync(bootstrapCssPath, libsPath, bootstrapCssName);

    return reportDest;
}

function copyFileSync(src, destFolder, destFilename) {
    var data = fs.readFileSync(src, 'utf8').toString();

    if (!fs.existsSync(destFolder))
        fs.mkdirSync(destFolder);

    fs.writeFileSync(path.normalize(destFolder + destFilename), data);
}