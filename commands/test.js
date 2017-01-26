
const notifier = require('../utils/notifier');

module.exports = {

    'init' : function (app, cfg) {

        app

            .command('test <req> [optional]')

            .description('test description')

            .option('-t, --t','we can still have add l options')

            .action(function(req,optional) {

                notifier.info("package version " + pkg.version);

                if (optional) {
                    optional.forEach(function(opt){
                        console.log("User passed optional arguments: %s", opt);
                    });
                }

            })
        ;

    }

}