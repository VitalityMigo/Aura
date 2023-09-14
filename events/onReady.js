/*
 * @file Ready Event File.
 * @author JAYZHVJ
 * @since 1.0.0
 * @version 3.2.2
 */
const { sequelize } = require('./database');

//Importation des fonctions à répéter
const intervalalerts = require('./intervalalerts')
const apiMonthlyChecker = require('./intervalapimonth')
const apiDayChecker = require('./intervalapidaily')
const apiConstantChecker = require('./intervalapiconstant')
const userMonthlyChecker = require('./intervalusermonthly')
const intervalSubDaily = require('./intervalsubdaily')
const intervalcleandatabase = require('./intervalcleandatabase')

const executeNewVerified = require('./monitor-verifiedcontracts')

const schedule = require('node-schedule');



module.exports = {
    name: "ready",
    once: true,


    // Optional Config object, but defaults to demo api-key and eth-mainnet.



    /*
     * @description Executes when client is ready (bot initialization).
     * @param {import('../typings').Client} client Main Application Client.
     */

    async execute(client) {
        try {



            await sequelize.authenticate();
            console.log(`Ready! Logged in as ${client.user.tag}`);



            ////// ALERTS //////

            //setInterval(() => intervalalerts(client), 60000)





            ////// API //////


            //Checker constant
            //setInterval(() => apiConstantChecker(client), 60000)


            //Rapport Journalier
            const apiDailyReport = schedule.scheduleJob('0 20 * * *', function () {
                apiDayChecker(client);
            });

            //Rapport Mensuel
            const apiMonthlyReport = schedule.scheduleJob('0 20 1 * *', function () {
                apiMonthlyChecker(client);
            });



            ////// USER //////


            //Rapport Mensuel - EN SUSPEND FTM

            // const userMonthlyReport = schedule.scheduleJob('0 20 1 * *', function () {
            //     userMonthlyChecker(client);
            // });


            ////// SUB. SINGLE //////


            //Checker constant
            const individualSubDailyCheck = schedule.scheduleJob('0 20 * * *', function () {
                intervalSubDaily(client);
            });


            ////// SUB. SINGLE //////


            //Checker constant
            const intervalcleandatabaseCheck = schedule.scheduleJob('0 20 * * *', function () {
                intervalcleandatabase(client);
            });


            // Verified contracts

            setInterval(async () => {

                console.log(await executeNewVerified())

            }, 120000);




        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }


    },


};

