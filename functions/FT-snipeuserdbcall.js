

const { sniper_friendTech, sequelize, Op } = require('../events/database');


// Exemple d'utilisation :


async function sniperUserTaskList(options) {


    const taskTable = []

    const whereClause = {
        active: "true",
        type: "new_user",
        walletAddress: { [Op.not]: null },
        privateKey: { [Op.not]: null },
        [Op.or]: [
            { target: options.target },
            { target: null },
        ],
    };

    const addCondition = (field, minField, maxField) => {

        whereClause[minField] = {
            [Op.or]: [
                { [Op.lte]: options[field] },
                { [Op.is]: null },


            ],

        };

        // Vérifiez si maxField est défini, puis ajoutez la condition
        whereClause[maxField] = {
            [Op.or]: [
                { [Op.gte]: options[field] },
                { [Op.is]: null },
            ],


        }

    };

    addCondition('price', 'min_total_price', 'max_total_price');
    addCondition('supply', 'min_supply', 'max_supply');
    addCondition('followers', 'min_followers', 'max_followers');
    addCondition('twitterScore', 'min_twitter_score', 'max_twitter_score');
    addCondition('uniqueHolders', 'min_unique_holders', 'max_unique_holders');

    const allTasks = await sniper_friendTech.findAll({ where: whereClause });


    for (const task of allTasks) {

        const obj = {
            authorName: task.dataValues.authorName,
            authorId: task.dataValues.authorId,
            target: task.dataValues.target,
            amount: task.dataValues.amount,
            keyPrice: task.dataValues.max_total_price,
            simulation: task.dataValues.simulation,
            gasPreset: task.dataValues.walletAddress,
            walletAddress: task.dataValues.walletAddress,
            walletPk: task.dataValues.privateKey,
            taskCount: task.dataValues.repeat,
            usage: task.dataValues.usage,
            taskNb: task.dataValues.taskNb,
            randomId: task.dataValues.randomId,
        }
        
        taskTable.push(obj)

    }

    return taskTable

} 


    module.exports = sniperUserTaskList


