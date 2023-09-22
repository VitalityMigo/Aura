/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, reportsql, watchlistSql, walletsgenerated, vouchData, wallets, accessSql, interactionData, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');



//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

const axios = require("axios");


module.exports = {
    id: "modal-gasSimulation",

    async execute(interaction) {


        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id
        let botId = interaction.applicationId

        try {


            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


            const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "gas-simulation", serverId: serverId } })


            const abi = JSON.parse(lastInteraction.dataValues.embed2)
            const infoTable = JSON.parse(lastInteraction.dataValues.embed3)
            const contextMenu = JSON.parse(lastInteraction.dataValues.pageIndex)

            const contract = infoTable[0].contract
            let sender = infoTable[0].sender
            const contractType = infoTable[0].contractType
            const functionCount = infoTable[0].functionCount
            const writableFunction = infoTable[0].writableFunction
            const notableFunctionsFormatted = infoTable[0].notableFunctionsFormatted
            const linksFormatted = infoTable[0].linksFormatted



            const functionName = infoTable[0].functionName
            const inputsCount = infoTable[0].inputsCount
            const inputsName = infoTable[0].inputsName
            const inputsType = infoTable[0].inputsType



            const fieldValues = []


            for (let i = 1; i <= inputsCount; i++) {

                const field = interaction.fields.getTextInputValue(`GasSimulationFunction-row${i}`);

                if (field) {
                    fieldValues.push(field);
                }
            }


            console.log(sender)
            if (sender == "0x") {
                const call = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + contract + "&apikey=" + etherscanApiKey)
                sender = await call.data.result[0].contractCreator
            }
            console.log(sender)

            const gasPriceCall = await web3.eth.getGasPrice()
            const gasPriceGwei = gasPriceCall / 10 ** 9
            const gasPriceEth = gasPriceCall / 10 ** 18


            const myContract = await new web3.eth.Contract(abi, contract);


            let gasEstimation = 0
            let isValid = true
            let errorMessageFormatted = ""
            try {
                console.log("ici")
                gasEstimation = await myContract.methods[functionName](...fieldValues).estimateGas({ from: sender.toLowerCase() });
            } catch (error) {
                isValid = false
                let message = error.message
                console.log("erreur")
                if (message.startsWith("Returned")) {
                    errorMessageFormatted = message.replace("Returned error: ", "")
                } else if (message.startsWith("invalid")) {
                    errorMessageFormatted = "Execution reverted : the argument provided aren't in the valid format"
                } else {
                    errorMessageFormatted = "Execution reverted : the argument provided aren't valid"
                }

            }

            let encodedABI = ""

            try {
                encodedABI = await myContract.methods[functionName](...fieldValues).encodeABI();
            } catch (error) {


                let inputsTypeFormatted = ""
                let index2 = 0

                for (const input of inputsType) {

                    inputsTypeFormatted += input

                    index2++

                    if (index2 != inputsType.length) { inputsTypeFormatted += "," }

                }

                let signatureString = functionName + "(" + inputsTypeFormatted + ")"

                console.log("sig : " + signatureString)

                encodedABI = await web3.utils.keccak256(signatureString)
                encodedABI = encodedABI.substring(0, 10) + " + encoded arguments"


            }


            const priceETA = gasEstimation * gasPriceEth


            let resultFormatted = ""
            let functionFormatted = ""
            let inputsFormatted = ""


            let index = 0

            for (const input of inputsName) {

                inputsFormatted += input

                index++

                if (index != inputsName.length) { inputsFormatted += ", " }

            }

            functionFormatted = functionName + "(" + inputsFormatted + ")"


            if (isValid == true) {
                resultFormatted = "[SETTINGS]\nFunction: " + functionFormatted + "\nSender: " + sender + "\nGas price: " + parseFloat(gasPriceGwei).toFixed(2) + " gwei\n\n[SIMULATION]\nGas units used: " + gasEstimation + "\nEstimated price: " + parseFloat(priceETA).toFixed(5) + "Ξ"
            } else if (isValid == false) {
                resultFormatted = "[SETTINGS]\nFunction: " + functionFormatted + "\nSender: " + sender + "\nGas price: " + parseFloat(gasPriceGwei).toFixed(2) + " gwei\n\n[SIMULATION]\n" + errorMessageFormatted
            }

            let responseText = "✅ Your action has been succesfuly estimated. You can simulate as much function as you want using the select menu below."




            const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Gas Simulation")
                .setDescription(">>> Displaying the contract simulation")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Contract", value: "`" + contract.toLowerCase() + "`", inline: false },
                    { name: "Type", value: "`" + contractType + "`", inline: true },
                    { name: "Function Count", value: "`" + functionCount + "`", inline: true },
                    { name: "Write Function Count", value: "`" + writableFunction + "`", inline: true },
                    { name: "Notable Functions:", value: "```" + notableFunctionsFormatted + "```", inline: false },
                    { name: "Simulation:", value: "```" + resultFormatted + "```", inline: false, },
                    { name: "Encoded Data:", value: "```" + encodedABI + "```", inline: false, },
                    { name: " ", value: "*Tips : these data can be used to submit this transaction to an Ethereum node.*", inline: false, },
                    { name: "Links:", value: linksFormatted, inline: false, },
                    { name: " ", value: " ", inline: false, },
                    { name: " ", value: responseText, inline: false, },


                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




            await interaction.update({ embeds: [gasTrackerEmbed], components: [contextMenu] });








            return;

        } catch (error) {



            console.log("// Error - sent in report ❌")

            //On envoi une notif
            const botAdmins = await adminsql.findOne({ where: { botId: botId } })
            const mainServerId = botAdmins.dataValues.mainServerId
            const logChannelId = botAdmins.dataValues.logChannelId
            const guild = interaction.client.guilds.cache.get(mainServerId);
            const channel = guild.channels.cache.get(logChannelId);


            const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
            let adminRoleId = adminAccessInfos.dataValues.adminRoleId
            let serverName = adminAccessInfos.dataValues.serverName
            const userRoleList = interaction.member._roles
            let userHighestRole = "Member"
            if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
            let reportCommand = "/admin-clientNew1"

            const timeStamp = Date.now();
            const date = new Date(timeStamp);
            const dateLisible = date.toLocaleString();
            const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
            const formattedDate = date1.format('Do [of] MMMM YYYY');



            //On enregistre le call
            await reportsql.create({
                botId: botId,
                authorId: "Bot",
                serverName: serverName,
                authorRole: userHighestRole,
                serverId: serverId,
                date: formattedDate,
                reportType: "Bug",
                reportCommand: reportCommand,
                reportDescription: "```" + error.stack + "```",
                reportPriority: "5",
                reportState: "Not treated",
            })


            console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

            const reduceText = require("../../../functions/reducetext")
            const roleTag = "1121510423687090186"


            const updateEmbed = new EmbedBuilder().setColor("#060A8F")
                .setTitle("New Report")
                .setDescription(">>> A new report has just been sent.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
                .setTimestamp()
                .addFields(
                    { name: " ", value: " ", inline: false },
                    { name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },
                    { name: " ", value: " ", inline: false },
                    { name: "Error:", value: "```" + reduceText(error.stack, 1024) + "```", inline: false },
                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await channel.send("<@&" + roleTag + ">");

            await channel.send({ embeds: [updateEmbed] });


            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("An error occured")
                .setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};
