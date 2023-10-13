

const { order_friendTech, sequelize, Op } = require('../events/database');


// Exemple d'utilisation :


async function orderDepositTaskList(options) {

    const taskTable = []

    const whereClause = {
        active: "true",
        targetWallet: options.target,
        walletAddress: { [Op.not]: null },
        privateKey: { [Op.not]: null },
        [Op.or]: [
            { min_key_price: { [Op.gt]: options.keyPrice } },
            { max_key_price: { [Op.lt]: options.keyPrice } },
        ],

    };

    const allTasks = await order_friendTech.findAll({ where: whereClause });


    for (const task of allTasks) {

        const obj = {
            authorName: task.dataValues.authorName,
            authorId: task.dataValues.authorId,
            target: task.dataValues.target,
            targetWallet: task.dataValues.targetWallet,
            type: task.dataValues.type,
            amount: task.dataValues.amount,
            lowPrice: task.dataValues.min_key_price,
            highPrice: task.dataValues.max_key_price,
            simulation: task.dataValues.simulation,
            gasPreset: task.dataValues.gas_preset,
            walletAddress: task.dataValues.walletAddress,
            walletPk: task.dataValues.privateKey,
            taskCount: task.dataValues.repeat,
            taskNb: task.dataValues.taskNb,
            randomId: task.dataValues.randomId,
        }

        taskTable.push(obj)

    }

    return taskTable

}



module.exports = orderDepositTaskList


