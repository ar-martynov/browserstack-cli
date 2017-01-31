#!/usr/bin/env node

/**
 * Require dependencies
 *
 */

const pkg = require('./package.json');
const cfg = require('./config.json');
const app = require('commander');

var browserstack = require('./services/browserstack').init(cfg);

// register all commands
require('./commands/info').init(app, browserstack);
require('./commands/report').init(app, browserstack);
require('./commands/screenshot').init(app, browserstack);

// current app version
app.version('bs-cli: ' + pkg.version);

// notice that we have to parse in a new statement.
app.parse(process.argv);

// if program was called with no arguments, show help.
if (app.args.length === 0) app.help();

// node index.js command requiredValue -o