const BrowserStack = require('../api/browserstack');

module.exports = {
    'init': init
}

var browserstack = undefined;

function init(cfg) {
    if (!cfg.browserstack){
        throw Error('BrowserStack credentials not passed with config');
    }

    return browserstack = {
        'client': BrowserStack.createClient(cfg.browserstack),
        'automateClient': BrowserStack.createAutomateClient(cfg.browserstack),
        'screenshotClient': BrowserStack.createScreenshotClient(cfg.browserstack)
    };
}