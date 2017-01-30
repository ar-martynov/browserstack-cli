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
    console.warn(chalk.red.bold.underline(   "[WARNING | " + now() + "] " + msg ));
};

function info(msg, data) {
    console.info(chalk.green.bold.underline( "[INFO | " + now() + "] " + msg ));
    if (data) console.info(data);
};

function error(msg, err) {
    console.error(chalk.red.bold.underline(  "[ERROR | " + now() + "] " + msg ));
    if (err) console.error(err);
};

function now(format) {
    return format ? moment().format(format) : moment().format('hh:mm:ss');
};