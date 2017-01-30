'use strict';

const Handlebars = require('handlebars');
const htmlpdf = require('html-pdf');
const defaults = require('lodash.defaults');
const Promise = require('bluebird');

const defaultOptions = {
        "format": "A4",
        "orientation": "portrait",
        "border": "10mm"
    };

module.exports = {
    create: create
};

function create(document) {

    var options = defaults(document.options, defaultOptions);

    /* Compile handlebars template */
    /* Create promise and return it! */
    return new Promise(function (resolve, reject) {

            /* Check options have been supplied correctly.
             * template_html and template_data,
             * and optional layout_settings is Required
             */
        if (!document || !document.path || !document.template || !document.context) {
            reject(new Error("Some, or all, options are missing."))
        }

        var html = Handlebars.compile(document.template)(document.context);

        /* Create PDF and resolve/reject promise */
        htmlpdf

            .create(html, options)

            .toFile(document.path, function (err, res) {
                if (!err)
                    resolve(res);
                else
                    reject(err);
            });
    });
}