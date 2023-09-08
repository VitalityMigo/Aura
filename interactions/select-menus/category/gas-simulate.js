/**
 * @file Sample Select-Menu interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { profileData, accessSql, apimonitorsql, wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, sequelize } = require('../../../events/database');


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey


//Web3 API + Cloudfare Provider
var Web3 = require("web3")
const web3 = new Web3("https://cloudflare-eth.com")

const axios = require("axios");




module.exports = {
    id: "select-GasSimulationFunction",

    async execute(interaction) {


        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


        const selectedFunction = interaction.values[0]


        const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "gas-simulation", serverId: serverId } })

        const abi = JSON.parse(lastInteraction.dataValues.embed2)
        const infoTable = JSON.parse(lastInteraction.dataValues.embed3)

        const functionObject = abi.find((func) => func.name == selectedFunction);
        const functionInputs = functionObject.inputs
        const inputsCount = functionInputs.length
        const inputsName = functionInputs.map(objet => objet.name);
        const inputsType = functionInputs.map(objet => objet.type);

        infoTable[0].functionName = selectedFunction
        infoTable[0].inputsCount = inputsCount
        infoTable[0].inputsName = inputsName
        infoTable[0].inputsType = inputsType

        console.log("count =" + inputsCount)



        if (inputsCount > 0 && inputsCount <= 5) {


            const inputsList = new ModalBuilder()
                .setCustomId('modal-gasSimulation')
                .setTitle('Enter the desired value');


            let index = 0

            console.log(functionInputs)

            for (const input of functionInputs) {

                index++

                if (index <= 5) {

                    let name = input.name
                    let type = input.type


                    // Create the text input components
                    const row = new TextInputBuilder()
                        .setCustomId("GasSimulationFunction-row" + index)
                        .setLabel(name)
                        .setPlaceholder(type)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)



                    const rowComponents = new ActionRowBuilder().addComponents(row);
                    inputsList.addComponents(rowComponents)

                }
            }

            console.log(inputsList)
            // Show the modal to the user
            await interaction.showModal(inputsList);




            await interactionData.update({ embed3: JSON.stringify(infoTable), }, { where: { authorId: authorId, commandName: "gas-simulation", serverId: serverId } })

        } else if (inputsCount <= 0) {




            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")

            //Checkpoint
            console.log("// Step 2 : Authorization - Executed ✅")


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


            functionFormatted = functionName + "()"


            if (isValid == true) {
                resultFormatted = "[SETTINGS]\nFunction: " + functionFormatted + "\nSender: " + sender + "\nGas price: " + parseFloat(gasPriceGwei).toFixed(2) + " gwei\n\n[SIMULATION]\nGas units used: " + gasEstimation + "\Estimated price: " + parseFloat(priceETA).toFixed(5) + "Ξ"
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









        } else if (inputsCount > 5) {



            const lastInteraction = await interactionData.findOne({ where: { authorId: authorId, commandName: "gas-simulation", serverId: serverId } })



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





            console.log(sender)
            if (sender == "0x") {
                const call = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + contract + "&apikey=" + etherscanApiKey)
                sender = await call.data.result[0].contractCreator
            }
            console.log(sender)



            const gasPriceCall = await web3.eth.getGasPrice()
            const gasPriceGwei = gasPriceCall / 10 ** 9





            let resultFormatted = ""
            let functionFormatted = ""
            let inputsFormatted = ""
            let inputsTypeFormatted = ""
            let signatureString = ""
            let signatureFunction = ""


            let index = 0

            for (const input of inputsName) {

                inputsFormatted += input

                index++

                if (index != inputsName.length) { inputsFormatted += ", " }

            }

            let index2 = 0

            for (const input of inputsType) {

                inputsTypeFormatted += input

                index2++

                if (index2 != inputsType.length) { inputsTypeFormatted += "," }

            }

            functionFormatted = functionName + "(" + inputsFormatted + ")"
            signatureString = functionName + "(" + inputsTypeFormatted + ")"

            console.log("sig : " + signatureString)

            signatureFunction = await web3.utils.keccak256(signatureString)
            signatureFunction = signatureFunction.substring(0, 10) + " + encoded arguments"


            resultFormatted = "[SETTINGS]\nFunction: " + functionFormatted + "\nSender: " + sender + "\nGas price: " + parseFloat(gasPriceGwei).toFixed(2) + " gwei\n\n[SIMULATION]\nAura doesn't support function simulation with more than 5 arguments for the moment. This will be added soon."


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
                    { name: "Encoded Data:", value: "```" + signatureFunction + "```", inline: false, },
                    { name: " ", value: "*Tips : these data can be used to submit this transaction to an Ethereum node.*", inline: false, },
                    { name: "Links:", value: linksFormatted, inline: false, },
                    { name: " ", value: " ", inline: false, },
                    { name: " ", value: responseText, inline: false, },


                )
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




            await interaction.update({ embeds: [gasTrackerEmbed], components: [contextMenu] });




        }
        return;
    },
};

