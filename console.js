/**
 * Created by anthony on 28/02/2016.
 */
const repl = require('repl')
const replHistory = require('repl.history')
// environment configuration
const epa = require('epa')

// database
const models = require('./models')
const moment = require('moment')

models.sequelize.sync().then(function () {
    let envName = process.env.NODE_ENV || "dev";

    // open the repl session
    let replServer = repl.start({
        prompt: "Rype API (" + envName + ") > "
    });
    replHistory(replServer, process.env.HOME + '/.node_history');
    // attach my modules to the repl context
    replServer.context.epa = epa;
    replServer.context.db = models;
    replServer.context.moment = moment;
}).catch((error) => {
    console.error(error)
})