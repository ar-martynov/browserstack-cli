#!/usr/bin/env node

'use strict';

/**
 * Require dependencies
 *
 */

const program = require('commander');
const chalk =  require("chalk");
const pkg = require('./package.json');

{
    program

        .version(pkg.version)

        .command('command <req> [optional]')

        .description('command description')

        .option('-o, --option','we can still have add l options')

        .action(function(req,optional) {

            console.log(chalk.green.bold.underline("INFO EXAMPLE: ") + '.action() allows us to implement the command');
            console.log(chalk.green.bold.underline("INFO EXAMPLE: ") + 'User passed %s', req);
            console.log(chalk.red.bold.underline("ERROR EXAMPLE: package version " + pkg.version));

            if (optional) {
                optional.forEach(function(opt){
                    console.log("User passed optional arguments: %s", opt);
                });
            }

        })

        ;

    program.parse(process.argv); // notice that we have to parse in a new statement.

    // if program was called with no arguments, show help.
    if (program.args.length === 0) program.help();
}

// node index.js command requiredValue -o