'use strict';

const chalk =  require('chalk');
const moment = require('moment');

module.exports = {
    error : error,
    info : info,
    warning : warning,
    now: now
};

function warning(msg) {
    console.log(chalk.magenta.bold(`[WARNING | ${now()}] ${msg}`));
}

function info(msg, data) {
    console.log(chalk.white.bold(`[INFO | ${now()}] ${msg}`));
    if (data) console.info(data);
}

function error(msg, err) {
    console.log(chalk.red.bold(`[ERROR | ${now()}] ${msg}`));
    if (err) console.error(err);
}

function now(format) {
    return format ? moment().format(format) : moment().format('hh:mm:ss');
}