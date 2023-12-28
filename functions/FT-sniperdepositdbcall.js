const { sniper_friendTech, sequelize, Op } = require('../events/database');


// Exemple d'utilisation :


async function sniperDepositTaskList(options) {


    const taskTable = []

    const whereClause = {
        active: "true",
        type: "new_deposit",
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
    addCondition('deposit', 'min_deposit_value', 'max_deposit_value');
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
            gasPreset: task.dataValues.gas_preset,
            walletAddress: task.dataValues.walletAddress,
            walletPk: task.dataValues.privateKey,
            taskCount: task.dataValues.repeat,
            usage: task.dataValues.usage,
            taskNb: task.dataValues.taskNb,
            randomId: task.dataValues.randomId,
            stopLoss: task.dataValues.stop_loss,
            takeProfit: task.dataValues.take_profit,

        }
        
        taskTable.push(obj)

    }

    return taskTable

} 


    module.exports = sniperDepositTaskList


