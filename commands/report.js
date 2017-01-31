'use strict';

const notifier = require('../utils/notifier');
const reports = require('../services/report');
const fs = require('fs');
const cfg = require("../config.json");

module.exports = {

    'init': init

};

var browserstack = undefined;

function init(app, bs) {

    browserstack = bs;

    app

        .command('report [build]')

        .description('Get build report')

        .action(cmdHandler)
    ;

};


function cmdHandler (buildName) {

    if (!buildName) {
        notifier.error('"build name/id" parameter required'); return;
    }

    notifier.info('Trying to get build.');
    {
        processBuilds.searchName = buildName;
        browserstack.automateClient.getBuilds({limit: 3}, processBuilds);
    }

}

function processBuilds(error, builds) {

    if (error) {
        notifier.error('Browser stack server error', error); process.exit(500);
    }

    if (builds.length === 0) {
        notifier.info('Project builds not found.');  process.exit(404);
    }

    //Filters
    //In order to view a subset of results, you can use the filter parameter to refine your results.
    // The three values the parameter takes are running, done and failed.

    var build = undefined;
    {
        builds.some(function (item) {
            if (item.name === processBuilds.searchName) {
                build = item; return true;
            }
        });
    }

    if (!build) {
        notifier.info('Build not found.');  process.exit(404);
    }

    notifier.info("Build found: ", build);
    notifier.info('Getting build sessions.');

    browserstack.automateClient.getSessions(build.hashed_id, function(error, sessions){

        if (error) {
            notifier.error('Error while sessions retrieving.', error);  process.exit(500);
        }

        if (sessions.length === 0) {
            notifier.info('Sessions not found.', error); process.exit(404);
        }

        notifier.info(sessions.length + " build sessions was founded.");
        notifier.info("Generating report...");

        var reportDest = cfg.reportsPath + "build_" +
            processBuilds.searchName.replace(' ', '_') + "_" +
            notifier.now("DD-MM-YYYY-hh-mm") + ".pdf";

        var document = {
            template: fs.readFileSync('./templates/build-report.hbs', 'utf8'),
            path: reportDest,
            context: {
                sessions: sessions,
                build: build,
                generatedAt: notifier.now("DD/MM/YYYY hh:mm:ss")
            }
        };


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
    });
}


