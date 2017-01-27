'use strict';

const chalk =  require('chalk');
const moment = require('moment');

function now() {
    return moment().format('hh:mm:ss');
}

module.exports = {
    error : function (msg, err) {
        console.error(chalk.red.bold.underline(  "[ERROR   | " + now() + "]: " + msg ));
        if (err) console.error(err);
    },

    warning : function (msg) {
        console.warn(chalk.red.bold.underline(   "[WARNING | " + now() + "]: " + msg ));
    },

    info : function(msg, data) {
        console.info(chalk.green.bold.underline( "[INFO    | " + now() + "]: " + msg ));
        if (data) console.info(err);
    }
};