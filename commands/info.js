const notifier = require('../utils/notifier');

module.exports = {
    'init': init
}

var browserstack = undefined;

//

function init(app, bs) {

    browserstack = bs;

    app
        .command('info')
        .description('"Browser stack" supporting browser info.')
        .option('-s, --screenshot', 'The following browsers are available for screen shots', printScreenshotApiInfo)
        .option('-a, --automate', 'The following browsers are available for automated testing', printAutomateApiInfo)
        .action(printApiInfo)
    ;

}

function printScreenshotApiInfo() {
    browserstack.screenshotClient.getBrowsers(function(error, browsers) {
        if (error) {
            notifier.error("Error while retrieving screenshot testing info", error); return;
        }

        notifier.info("The following browsers are available for screenshot testing");
        console.log(browsers);
    });
}

function printAutomateApiInfo() {
    browserstack.automateClient.getBrowsers(function(error, browsers) {
        if (error) {
            notifier.error("Error while retrieving automated testing info", error); return;
        }

        notifier.info("The following browsers are available for automated testing");
        console.log(browsers);
    });
}

function printApiInfo() {

    browserstack.client.getBrowsers(function(error, browsers) {
        if (error) {
            notifier.error("Error while retrieving supported browsers info", error); return;
        }

        notifier.info("The following browsers are supporting");
        console.log(browsers);
    });
}

