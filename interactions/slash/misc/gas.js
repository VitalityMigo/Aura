/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { profileData, accessSql, apimonitorsql, wallets, reportsql, adminsql, usersql, interactionData, watchlistSql, sequelize } = require('../../../events/database');

// Param d'infrastructure
const { authPrivacyMulti, communityInfos } = require("../../../functions/infra-utils")
const privateCMD = []

const moment = require('moment');
const axios = require('axios')

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey


function keyword(abi, keyword) {
    return abi.filter((item) => item.name.includes(keyword));
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("gas")
        .setDescription("Various gas fees related commands.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("calculator")
                .setDescription("Estimate a transaction cost depending on your gas settings")
                .addStringOption(option =>
                    option
                        .setName("price")
                        .setDescription("The collection's mint price")
                        .setRequired(true)

                )
                .addStringOption(option =>
                    option
                        .setName("quantity")
                        .setDescription("The number of tokens you want to buy")
                        .setRequired(true)


                )
                .addStringOption(option =>
                    option
                        .setName("gas-limit")
                        .setDescription("The amount of gas units you want to use")
                        .setRequired(true)


                )
                .addStringOption(option =>
                    option
                        .setName("max-gas-fees")
                        .setDescription("The max amount of gas fees you want to pay")
                        .setRequired(true)


                )
                .addStringOption(option =>
                    option
                        .setName("max-priority")
                        .setDescription("The max amount of gas fees you want to pay")
                        .setRequired(true)


                ),


        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("tracker")
                .setDescription("Display the current gas fees on Bitcoin or Ethereum.")
                .addStringOption((option) =>
                    option
                        .setName("chain")
                        .setDescription("Select the chain to analyze")
                        .setRequired(true)
                        .setChoices(
                            {
                                name: 'Ethereum',
                                value: 'Ethereum',
                            },
                            {
                                name: 'Bitcoin',
                                value: 'Bitcoin',
                            }
                        )
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("simulation")
                .setDescription("Simulate the cost of a transaction on a specific contract.")
                .addStringOption((option) =>
                    option
                        .setName("contract")
                        .setDescription("The contract address you want to interact with.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("sender")
                        .setDescription("The address that will be use to simulate the action (contract owner by default")
                        .setRequired(false)
                ),
        ),





    // Début de l'éxecution de la commande
    async execute(interaction) {


        if (interaction.guildId != null) {



            //Récupérer informations de l'utilisateur de la commande
            let authorId = interaction.user.id;
            let authorName = interaction.user.username;
            let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
            let serverId = interaction.member.guild.id
            let member = interaction.member;
            let botId = interaction.applicationId

            const subcommand = interaction.options.getSubcommand()


            try {

                console.log("Initialization: executed ✅")

                // Récupère les infos de la communauté
                const community = await communityInfos(serverId)

                //Récupère régagle de privé/ou pas de l'utilisateur
                const privacy = await authPrivacyMulti(authorId, subcommand, privateCMD)
                if (privacy) { await interaction.deferReply({ ephemeral: true }) }
                else { await interaction.deferReply() }


                // Les vérifications
                if (community.statut) {
                    
                    if (community.tier === 's-tier' || community.tier === 'a-tier') {

                        if (member.roles.cache.has(community.member)) {


                            if (subcommand === 'calculator') {


                                // const buttonsRow = new ActionRowBuilder()
                                // .addComponents(
                                //     new ButtonBuilder()
                                //         .setCustomId('gascalculatorCopy-button')
                                //         .setLabel('copy to clipboard')
                                //         .setStyle(2),
                                // );




                                const mintPrice = interaction.options.getString("price");
                                const quantity = interaction.options.getString("quantity");
                                const gasLimit = interaction.options.getString("gas-limit");
                                const maxGas = interaction.options.getString("max-gas-fees");
                                const maxPriority = interaction.options.getString("max-priority");



                                if (maxGas >= maxPriority) {


                                    const min = (mintPrice * quantity) + (maxPriority * (gasLimit / 1000000000))
                                    const max = (mintPrice * quantity) + (maxGas * (gasLimit / 1000000000))



                                    console.log("min :" + min)
                                    console.log("max :" + max)

                                    let gasFormatted = "An error occured when calculating the gas metrics"

                                    if (min && max) {

                                        gasFormatted = "Minimum total: " + parseFloat(min).toFixed(3) + "Ξ\nMaximum total: " + parseFloat(max).toFixed(3) + "Ξ\n\nMinimum average: " + parseFloat(min / quantity).toFixed(3) + "Ξ\nMaximum average: " + parseFloat(max / quantity).toFixed(3) + "Ξ\n\nAverage derisk: " + parseFloat(((max / quantity) + (min / quantity)) / 2).toFixed(3) + "Ξ"

                                    }



                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Gas tracker")
                                        .setDescription(">>> Display the transaction's gas fees simulation based on the data")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: "Price", value: "`" + parseFloat(mintPrice).toFixed(3) + "Ξ`", inline: true },
                                            { name: "Quantity", value: "`" + quantity + " tokens`", inline: true },
                                            { name: " ", value: " ", inline: true },
                                            { name: "Gas Limit", value: "`" + gasLimit + " gwei`", inline: true },
                                            { name: "Max Gas Fees", value: "`" + maxGas + " gwei`", inline: true },
                                            { name: "Max Priority", value: "`" + maxPriority + " gwei`", inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: "Gas Metrics:", value: "```" + gasFormatted + "```", inline: false },

                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed] });

                                } else {


                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Gas tracker")
                                        .setDescription("The gas metrics can't be calculated. The value of `max-priority` can't be higher than the value of `max-gas-fees`. Try again using the apporpriate values.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed] });





                                }

                            } else if (subcommand === 'tracker') {

                                const chain = interaction.options.getString("chain")



                                if (chain.toLowerCase() == "ethereum") {


                                    const gasOracle = await axios.get('https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=' + etherscanApiKey)

                                    const slowGas = gasOracle.data.result.SafeGasPrice
                                    const midGas = gasOracle.data.result.ProposeGasPrice
                                    const fastGas = gasOracle.data.result.FastGasPrice
                                    const suggestedBaseFee = (gasOracle.data.result.suggestBaseFee - 0.000001).toFixed(2)
                                    const lastBlock = gasOracle.data.result.LastBlock

                                    const gasTime = await axios.get('https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=' + fastGas * 10000000000 + '&apikey=' + etherscanApiKey)


                                    const averageTime = gasTime.data.result


                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Gas Tracker")
                                        .setDescription(">>> Display the current Ethereum gas metrics")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: "Slow 🐢", value: "`" + slowGas + " gwei`", inline: true },
                                            { name: "Medium 🦋", value: "`" + midGas + " gwei`", inline: true },
                                            { name: "Aggressive 🦈", value: "`" + fastGas + " gwei`", inline: true },
                                            { name: "Base Fees", value: "`" + suggestedBaseFee + " gwei`", inline: true },
                                            { name: "Average Time", value: "`" + averageTime + " seconds`", inline: true },
                                            { name: "Last Block", value: "`" + lastBlock + "`", inline: true },
                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed] });


                                    //On enregistre le call API dans la database
                                    const timeStamp = Date.now();
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/gastracker", apiCallName: "gasOracle", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                                    await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/gastracker", apiCallName: "txnAvgTime", apiProvider: "etherscan", timestamp: timeStamp.toString() })




                                } else if (chain.toLowerCase() == "bitcoin") {



                                    const mempoolSuggestedCall = await axios.get("https://mempool.space/api/v1/fees/recommended")
                                    const mempoolBlockCall = await axios.get("https://mempool.space/api/v1/fees/mempool-blocks")


                                    const slowGas = mempoolSuggestedCall.data.hourFee
                                    const midGas = mempoolSuggestedCall.data.halfHourFee
                                    const fastGas = mempoolSuggestedCall.data.fastestFee
                                    const suggestedBaseFee = mempoolSuggestedCall.data.economyFee
                                    const minimumFee = mempoolSuggestedCall.data.minimumFee
                                    //console.log()
                                    const medianFee = parseFloat(mempoolBlockCall.data[0].medianFee).toFixed(2)

                                    console.log(slowGas)
                                    console.log(midGas)
                                    console.log(fastGas)
                                    console.log(suggestedBaseFee)
                                    console.log(minimumFee)
                                    console.log(medianFee)


                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Gas Tracker")
                                        .setDescription(">>> Display the current Bitcoin gas metrics")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .addFields(
                                            { name: "Slow 🐢", value: "`" + slowGas + " sats`", inline: true },
                                            { name: "Medium 🦋", value: "`" + midGas + " sats`", inline: true },
                                            { name: "Aggressive 🦈", value: "`" + fastGas + " sats`", inline: true },
                                            { name: "Base Fees", value: "`" + suggestedBaseFee + " sats`", inline: true },
                                            { name: "Min. Fees", value: "`" + minimumFee + " sats`", inline: true },
                                            { name: "Median Fees", value: "`" + medianFee + " sats`", inline: true },
                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed] });




                                }


                            } else if (subcommand === 'simulation') {



                                const selectMenuCommand = new StringSelectMenuBuilder()
                                    .setCustomId('select-GasSimulationFunction')
                                    .setPlaceholder('Select the function to simulate.')



                                const contract = interaction.options.getString("contract").toLowerCase()
                                let sender = "0x"

                                if (interaction.options.getString("sender")) {
                                    sender = interaction.options.getString("sender")
                                }
                                console.log(sender)

                                const contractAbiCall = await axios.get("https://api.etherscan.io/api?module=contract&action=getabi&address=" + contract + "&apikey=" + etherscanApiKey)
                                let contractAbi = contractAbiCall.data.result

                                let contractType = "N/A"
                                let functionCount = 0
                                let writableFunction = 0
                                let linksFormatted = ""

                                let notableFunctionsFormatted = ""



                                if (contractAbi.startsWith("[{")) {

                                    // On enregistre l'ABI ainsi que la version filtré
                                    contractAbi = JSON.parse(contractAbi)
                                    const filteredAbi = contractAbi.filter(item => item.stateMutability !== 'pure' && item.stateMutability !== 'view' && item.type == 'function');
                                    const notableAbi = filteredAbi.filter(item => (item.name.toLowerCase()).includes("mint") || (item.name.toLowerCase()).includes("swap") || (item.name.toLowerCase()).includes("approve") || (item.name.toLowerCase()).includes("claim"));

                                    functionCount = (contractAbi.filter(item => item.type == 'function')).length
                                    writableFunction = filteredAbi.length

                                    // On définit la nature du contrat
                                    const functionNames = contractAbi.map((item) => item.name);
                                    const hasERC721Functions =
                                        functionNames.includes('ownerOf') &&
                                        functionNames.includes('name') &&
                                        functionNames.includes('symbol') &&
                                        functionNames.includes('approve');

                                    const hasERC20Functions =
                                        functionNames.includes('name') &&
                                        functionNames.includes('symbol') &&
                                        functionNames.includes('balanceOf') &&
                                        !functionNames.includes('ownerOf');

                                    if (hasERC721Functions) {
                                        contractType = 'ERC721';
                                    } else if (hasERC20Functions) {
                                        contractType = 'ERC20';
                                    } else { contractType = 'Random' }




                                    notableAbi.sort((a, b) => {

                                        const customOrder = ['mint', 'claim', 'swap', 'approve'];

                                        const nameA = a.name.toLowerCase();
                                        const nameB = b.name.toLowerCase();
                                        const indexA = customOrder.indexOf(nameA);
                                        const indexB = customOrder.indexOf(nameB);
                                        return indexA - indexB;
                                    });


                                    for (const notableFunction of notableAbi) {

                                        let name = notableFunction.name
                                        let inputs = notableFunction.inputs
                                        let type = notableFunction.stateMutability

                                        let inputsFormatted = ""
                                        let index = 0

                                        for (const input of inputs) {

                                            let inputName = input.name

                                            inputsFormatted += inputName

                                            index++

                                            if (index != inputs.length) { inputsFormatted += ", " }

                                        }


                                        notableFunctionsFormatted += name + "(" + inputsFormatted + ")\n"


                                    }


                                    let functionList = []

                                    for (const object of filteredAbi) {


                                        let name = object.name
                                        let inputs = object.inputs
                                        let type = object.stateMutability

                                        if (!functionList.includes(name)) {

                                            let inputsFormatted = ""
                                            let index = 0

                                            for (const input of inputs) {

                                                let inputName = input.name

                                                inputsFormatted += inputName

                                                index++

                                                if (index != inputs.length) { inputsFormatted += ", " }

                                            }

                                            let nameFormatted = name + "(" + inputsFormatted + ")"

                                            // console.log(notableAbi)
                                            const option = new StringSelectMenuOptionBuilder()
                                                .setValue(name)
                                                .setLabel(nameFormatted)
                                                .setDescription(type)


                                            selectMenuCommand.addOptions(option);


                                            functionList.push(name)
                                        }
                                    }


                                    const selectCommandGuide = new ActionRowBuilder()
                                        .addComponents(selectMenuCommand);



                                    if (notableFunctionsFormatted == "") { notableFunctionsFormatted += "No notable functions found in this contract.                            " }


                                    linksFormatted = '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[Functions](https://etherscan.io/address/' + contract + "#writeContract) ∙ " + '[Source Code](https://etherscan.io/address/' + contract + "#code) ∙ " + '[Code Reader](https://etherscan.io/code-reader?a=' + contract + ")"


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
                                            { name: "Links:", value: linksFormatted, inline: true },
                                            { name: " ", value: " ", inline: false },
                                            { name: " ", value: "**⬇︎ Choose which functions you would like to simulate among all the writable functions below ⬇︎**", inline: false },


                                        )
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed], components: [selectCommandGuide] });


                                    console.log(notableFunctionsFormatted)



                                    let argumentTable = []
                                    let obj = {}
                                    obj.contract = contract.toLowerCase()
                                    obj.sender = sender.toLowerCase()
                                    obj.contractType = contractType
                                    obj.functionCount = functionCount
                                    obj.writableFunction = writableFunction
                                    obj.notableFunctionsFormatted = notableFunctionsFormatted
                                    obj.linksFormatted = linksFormatted
                                    argumentTable.push(obj)

                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "gas-simulation", serverId: serverId } })

                                    await interactionData.create({

                                        authorId: authorId,
                                        authorName: authorName,
                                        serverId: serverId,
                                        commandName: "gas-simulation",
                                        interactionId: interaction.id,
                                        embed2: JSON.stringify(contractAbi),
                                        embed3: JSON.stringify(argumentTable),
                                        pageIndex: JSON.stringify(selectCommandGuide)

                                    })




                                } else if (contractAbi == "Contract source code not verified") {

                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Gas Simulation")
                                        .setDescription("The contract provided can't be simulated. You can only simulate a transaction on contracts that are verified on Etherscan.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed] });



                                } else {

                                    const gasTrackerEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle("Gas Simulation")
                                        .setDescription("The contract provided can't be simulated. Please try again or contact a team member to get help.")
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [gasTrackerEmbed] });



                                }









                            }

                        } else {



                            const notMember = new EmbedBuilder().setColor("#060A8F")
                                .setTitle(`Bot Access`)
                                .setDescription(">>> Showing access data")
                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                .addFields(
                                    { name: " ", value: " ", inline: false },
                                    { name: "Status", value: "`Denied ❌`", inline: true },
                                    { name: "Required Role", value: "<@&" + community.member + ">", inline: true },
                                    { name: "Reason:", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community.", inline: false },
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                            await interaction.editReply({ embeds: [notMember] });


                        }

                    } else {

                        const botOff = new EmbedBuilder().setColor("#060A8F")
                            .setTitle(`Bot Access`)
                            .setDescription("You can't use this feature. The access tier of this community is too low. Please contact an admin of the community to upgrade the access ❌")
                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                            .setAuthor({ name: authorName, iconURL: userAvatar })
                            .setTimestamp()
                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                        await interaction.editReply({ embeds: [botOff] });
                    }

                } else {

                    const botOff = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(`Bot Access`)
                        .setDescription("You can't use this feature. Aura is currently inactive in this community. Please contact an admin of the community to sort out an access to the bot ❌")
                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                        .setAuthor({ name: authorName, iconURL: userAvatar })
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    await interaction.editReply({ embeds: [botOff] });

                }


            } catch (error) {


                console.log("// Error - sent in report ❌")

                //On envoi une notif
                let botId = interaction.applicationId
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
                let reportCommand = "/gas"

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
                    .setFooter({ text: 'Powered by Aura', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


                await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


            }

        } else if (interaction.guildId == null) {

            const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
                .setTitle("Aura")
                .setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



        }

    }
};

