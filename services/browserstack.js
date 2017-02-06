const BrowserStack = require('../api/browserstack');

module.exports = {
    'init': init
}

var browserstack = undefined;

function init(cfg) {
    if (!cfg.browserstack || !cfg.browserstack.api){
        throw Error('BrowserStack credentials not passed with config');
    }

    return browserstack = {
        'client': BrowserStack.createClient(cfg.browserstack.api),
        'automateClient': BrowserStack.createAutomateClient(cfg.browserstack.api),
        'screenshotClient': BrowserStack.createScreenshotClient(cfg.browserstack.api)
    };
}