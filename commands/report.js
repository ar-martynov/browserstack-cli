'use strict';

const notifier = require('../utils/notifier');

module.exports = {

    'init': init

};

var browserstack = undefined;

function init(app, bs) {

    browserstack = bs;

    app

        .command('report [build]')

        .description('Get build report')

        .action(function (buildName) {

            if (!buildName) {
                notifier.error('"build" parameter required');
                return;
            }

            browserstack.automateClient.getBuilds(

                {limit: 3},

                function (error, builds) {

                    if (error) {
                        notifier.error('"build" parameter required', error); return;
                    }

                    if (builds.length === 0) {
                        notifier.info('Project not found.'); return;
                    }

                    var build = undefined;
                    {
                        builds.some(function (item) {
                            if (item.name === buildName) {
                                build = item; return true;
                            }
                        })
                    }

                    console.log(build);
                }
            );

            browserstack.automateClient.getJob("")

        })
    ;

};


