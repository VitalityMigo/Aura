

const { farmer_friendTech, sequelize, Op } = require('../events/database');


// Exemple d'utilisation :


async function farmerTaskListFT(options) {


    if (options.action == "buy") {

        const whereClause = {
            active: "true",
            authorWallet: options.address,
            buy_0_3: "true",
            walletAddress: { [Op.not]: null },
            privateKey: { [Op.not]: null },
            [Op.or]: [
                { max_key_price: { [Op.gte]: options.keyPrice } },
                { max_key_price: { [Op.is]: null } },

            ],

        };

        const task = await farmer_friendTech.findOne({ where: whereClause });

        if (task != null) {

            const obj = {
                authorName: task.dataValues.authorName,
                authorId: task.dataValues.authorId,
                address: task.dataValues.authorWallet,
                type: "buy",
                buy_status: task.dataValues.buy_0_3,
                max_key_price: task.dataValues.max_key_price,
                simulation: task.dataValues.simulation,
                gasPreset: task.dataValues.gas_preset,
                walletAddress: task.dataValues.walletAddress,
                walletPk: task.dataValues.privateKey,
            }

            return obj
        } else {
            return null
        }

    } else if (options.action == "sell") {

        const whereClause = {
            active: "true",
            authorWallet: options.address,
            sell_3_0: "true",
            walletAddress: { [Op.not]: null },
            privateKey: { [Op.not]: null },
            [Op.or]: [
                { min_key_price: { [Op.lte]: options.keyPrice } },
                { min_key_price: { [Op.is]: null } },

            ],

        };

        const task = await farmer_friendTech.findOne({ where: whereClause });

        if (task != null) {


            const obj = {
                authorName: task.dataValues.authorName,
                authorId: task.dataValues.authorId,
                address: task.dataValues.authorWallet,
                type: "sell",
                sell_status: task.dataValues.sell_3_0,
                min_key_price: task.dataValues.min_key_price,
                simulation: task.dataValues.simulation,
                gasPreset: task.dataValues.gas_preset,
                walletAddress: task.dataValues.walletAddress,
                walletPk: task.dataValues.privateKey,
            }

            return obj
        } else {
            return null
        }


    } else {
        return null
    }


}



module.exports = farmerTaskListFT


