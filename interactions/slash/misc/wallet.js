/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, wallets, walletsgenerated, reportsql, adminsql, usersql, interactionData, sequelize } = require('../../../events/database');
const moment = require('moment');

// Param d'infrastructure
const { authPrivacyMulti, communityInfos } = require("../../../functions/infra-utils")
const privateCMD = ['get', 'remove', 'raw', 'set']

// Nodes
const { web3CloudflarePublic } = require("../../../config/web3config")
const { getEthPrice } = require("../../../config/web3data");

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

// Packages
const axios = require('axios');
const csv = require('fast-csv');
const decrypt = require('../../../functions/decrypt');
const encrypt = require('../../../functions/encrypt');



function formatString(input) {
    return input.length > 42 ? `${input.substring(0, 19)}...${input.substring(input.length - 20)}` : input;
}
function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);

}
function isBRC20BitcoinWallet(wallet) {
    const regex = /^bc1[a-zA-Z0-9]{39,59}$/;

    return regex.test(wallet);
}
function isENS(str) {
    const lowerCaseStr = str.toLowerCase();
    return lowerCaseStr.endsWith(".eth");
}
function isSATS(str) {
    return str.endsWith(".sats");
}




module.exports = {
    data: new SlashCommandBuilder()
        .setName("wallet")
        .setDescription("Add, remove or display your wallet(s).")
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Info about a user')
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("ETH, BTC, ENS or SATS address of the wallet you want to set")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Name that you'd like to give to this wallet")
                        .setRequired(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("raw")
                .setDescription("Set a list of wallet in your portfolio, based on a CSV.")
                .addAttachmentOption((option) => option
                    .setRequired(false)
                    .setName("csv")
                    .setDescription("The CSV file including the wallets.")
                )
                .addStringOption((option) => option
                    .setRequired(false)
                    .setName("wallet-list")
                    .setDescription("A list of wallet or domain separated with punctuation marks")
                )
                .addStringOption((option) => option
                    .setRequired(false)
                    .setName("google-sheet")
                    .setDescription("A google sheet link including the wallets")
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("get")
                .setDescription("Display the wallets set in your portfolio"),

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove a wallet from your portfolio")
                .addStringOption(option =>
                    option
                        .setName("wallet")
                        .setDescription("Select the wallet(s) you want to remove from your portfolio")
                        .setRequired(true)
                        .setAutocomplete(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("generate")
                .setDescription("Create hundreeds of wallet in few seconds")
                .addStringOption(option =>
                    option
                        .setName("count")
                        .setDescription("The number of wallets you want to create.")
                        .setRequired(true)
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

                    if (community.tier === 's-tier' || community.tier === 'a-tier' || community.tier === 'b-tier') {

                        if (member.roles.cache.has(community.member)) {


                            if (subcommand === 'set') {



                                const setwalletEmbed = new EmbedBuilder().setColor("#060A8F");

                                // On déclare les variables présentes dans l'exécution (Embed, conditions etc)
                                let walletAddress = interaction.options.getString("wallet").toLowerCase();
                                let walletName = interaction.options.getString("name");
                                const walletUserAll = await wallets.findAll({ where: { authorId: authorId } })



                                if (walletUserAll.length <= 23) {

                                    const walletExists = await wallets.findOne({ where: { authorId: authorId, walletAddress: walletAddress } })


                                    if (!walletExists) {




                                        // Vérifie si le wallet est une addresse ETH valide
                                        if (isValidEthereumAddress(walletAddress)) {


                                            let walletCategory = "Ethereum"

                                            let linksFormatted = "[opensea](https://opensea.io/" + walletAddress + ") ∙ " + '[blur](https://blur.io/' + walletAddress + ") ∙ " + '[etherscan](https://etherscan.io/address/' + walletAddress + ") ∙ " + '[magically](https://magically.gg/portfolio/wallet/' + walletAddress + ") ∙ " + '[nansen](https://portfolio.nansen.ai/dashboard/' + walletAddress + ")"



                                            await wallets.create({
                                                authorId: authorId,
                                                walletName: walletName,
                                                walletAddress: walletAddress.toLowerCase(),
                                                walletCategory: "eth",
                                                authorUsername: authorName,

                                            })


                                            setwalletEmbed.setTitle(`${authorName}'s portfolio`)
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setDescription(`>>> The wallet has been successfully added to ` + authorName + `'s portfolio`)
                                                .setThumbnail(userAvatar)
                                                .addFields(
                                                    { name: 'Name', value: walletName, inline: true },
                                                    { name: 'Wallet', value: walletAddress.substring(0, 6) + "..." + walletAddress.substring(walletAddress.length - 5, walletAddress.length), inline: true },
                                                    { name: 'Type', value: walletCategory, inline: true },
                                                    { name: 'Links', value: linksFormatted, inline: false },
                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            // Send the embed as a response to the interaction
                                            await interaction.editReply({ embeds: [setwalletEmbed] });











                                        } else if (isENS(walletAddress)) {


                                            let ensToWallet = "0x0000000000000000000000000000000000000000"

                                            try {


                                                ensToWallet = await web3CloudflarePublic.eth.ens.getOwner(walletAddress)

                                            } catch (error) {

                                                const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`${authorName}'s portfolio`)
                                                    .setDescription("The ENS name you provided isn't valid. Try again using the appropriate form.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [setwalletErrorEmbed] });

                                            }




                                            if (isValidEthereumAddress(ensToWallet) && ensToWallet !== "0x0000000000000000000000000000000000000000") {



                                                const walletExists2 = await wallets.findOne({ where: { authorId: authorId, walletAddress: ensToWallet.toLowerCase() } })

                                                if (!walletExists2) {

                                                    let walletCategory = "ENS"

                                                    let linksFormatted = "[opensea](https://opensea.io/" + walletAddress + ") ∙ " + '[blur](https://blur.io/' + walletAddress + ") ∙ " + '[etherscan](https://etherscan.io/address/' + walletAddress + ") ∙ " + '[magically](https://magically.gg/portfolio/wallet/' + walletAddress + ") ∙ " + '[nansen](https://portfolio.nansen.ai/dashboard/' + walletAddress + ")"



                                                    await wallets.create({
                                                        authorId: authorId,
                                                        walletName: walletName,
                                                        walletAddress: ensToWallet.toLowerCase(),
                                                        walletCategory: "eth",
                                                        authorUsername: authorName,

                                                    })


                                                    setwalletEmbed.setTitle(`${authorName}'s portfolio`)
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setDescription(`>>> The wallet has been successfully added to ` + authorName + `'s portfolio`)
                                                        .setThumbnail(userAvatar)
                                                        .addFields(
                                                            { name: 'Name', value: walletName, inline: true },
                                                            { name: 'Wallet', value: ensToWallet.substring(0, 6) + "..." + ensToWallet.substring(ensToWallet.length - 5, ensToWallet.length), inline: true },
                                                            { name: 'Type', value: walletCategory, inline: true },
                                                            { name: 'Links', value: linksFormatted, inline: false },
                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                    // Send the embed as a response to the interaction
                                                    await interaction.editReply({ embeds: [setwalletEmbed] });


                                                } else {


                                                    const setwalletError2Embed = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(`${authorName}'s portfolio`)
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setDescription("The wallet address " + "**" + ensToWallet + "**" + " is already registered in your portfolio.")
                                                        .setThumbnail(userAvatar)
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                    await interaction.editReply({ embeds: [setwalletError2Embed] });




                                                }
                                            } else {


                                                const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`${authorName}'s portfolio`)
                                                    .setDescription("The ENS name you provided isn't valid or isn't held by a wallet. Try again using a valid ENS.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [setwalletErrorEmbed] });



                                            }


                                        } else if (isBRC20BitcoinWallet(walletAddress)) {

                                            let walletCategory = "Bitcoin"

                                            let linksFormatted = "[magic eden](https://magiceden.io/ordinals/wallet?walletAddress=" + walletAddress + ") ∙ " + '[mempool](https://mempool.space/address/' + walletAddress + ") ∙ " + '[ordiscan](https://ordiscan.com/address/' + walletAddress + ") ∙ " + '[blockchair](https://blockchair.com/bitcoin/address/' + walletAddress + ")"

                                            console.log("oui")


                                            await wallets.create({
                                                authorId: authorId,
                                                walletName: walletName,
                                                walletAddress: walletAddress,
                                                walletCategory: "btc",
                                                authorUsername: authorName,

                                            })


                                            setwalletEmbed.setTitle(`${authorName}'s portfolio`)
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setDescription(`>>> The wallet has been successfully added to ` + authorName + `'s portfolio`)
                                                .setThumbnail(userAvatar)
                                                .addFields(
                                                    { name: 'Name', value: walletName, inline: true },
                                                    { name: 'Wallet', value: walletAddress.substring(0, 6) + "..." + walletAddress.substring(walletAddress.length - 5, walletAddress.length), inline: true },
                                                    { name: 'Type', value: walletCategory, inline: true },
                                                    { name: 'Links', value: linksFormatted, inline: false },
                                                )
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            // Send the embed as a response to the interaction
                                            await interaction.editReply({ embeds: [setwalletEmbed] });







                                        } else if (isSATS(walletAddress)) {


                                            let satsToWallet = "0"

                                            try {


                                                const satsToWalletCall = await axios.get("https://api.sats.id/names/" + walletAddress.toLowerCase())
                                                satsToWallet = satsToWalletCall.data.owner

                                            } catch (error) { }




                                            if (isBRC20BitcoinWallet(satsToWallet) && satsToWallet !== "0") {



                                                const walletExists3 = await wallets.findOne({ where: { authorId: authorId, walletAddress: satsToWallet.toLowerCase() } })

                                                if (!walletExists3) {

                                                    let walletCategory = "SATS"

                                                    let linksFormatted = "[magic eden](https://magiceden.io/ordinals/wallet?walletAddress=" + satsToWallet + ") ∙ " + '[mempool](https://mempool.space/address/' + satsToWallet + ") ∙ " + '[ordiscan](https://ordiscan.com/address/' + satsToWallet + ") ∙ " + '[blockchair](https://blockchair.com/bitcoin/address/' + satsToWallet + ")"



                                                    await wallets.create({
                                                        authorId: authorId,
                                                        walletName: walletName,
                                                        walletAddress: satsToWallet.toLowerCase(),
                                                        walletCategory: "btc",
                                                        authorUsername: authorName,

                                                    })


                                                    setwalletEmbed.setTitle(`${authorName}'s portfolio`)
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setDescription(`>>> The wallet has been successfully added to ` + authorName + `'s portfolio`)
                                                        .setThumbnail(userAvatar)
                                                        .addFields(
                                                            { name: 'Name', value: walletName, inline: true },
                                                            { name: 'Wallet', value: satsToWallet.substring(0, 6) + "..." + satsToWallet.substring(satsToWallet.length - 5, satsToWallet.length), inline: true },
                                                            { name: 'Type', value: walletCategory, inline: true },
                                                            { name: 'Links', value: linksFormatted, inline: false },
                                                        )
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                    // Send the embed as a response to the interaction
                                                    await interaction.editReply({ embeds: [setwalletEmbed] });


                                                } else {


                                                    const setwalletError2Embed = new EmbedBuilder().setColor("#060A8F")
                                                        .setTitle(`${authorName}'s portfolio`)
                                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                                        .setDescription("The wallet address " + "**" + satsToWallet + "**" + " is already registered in your portfolio.")
                                                        .setThumbnail(userAvatar)
                                                        .setTimestamp()
                                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                                    await interaction.editReply({ embeds: [setwalletError2Embed] });




                                                }
                                            } else {


                                                const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                    .setTitle(`${authorName}'s portfolio`)
                                                    .setDescription("The SATS name you provided isn't valid or isn't held by a wallet. Try again using a valid SATS.")
                                                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                                    .setTimestamp()
                                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                                await interaction.editReply({ embeds: [setwalletErrorEmbed] });



                                            }





                                        } else {




                                            const setwalletErrorEmbed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`${authorName}'s portfolio`)
                                                .setDescription("The wallet you try to set isn't a valid Ethereum, Bitcoin, ENS or SATS address. Try again using the appropriate form.")
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [setwalletErrorEmbed] });


                                        }








                                    } else {


                                        const setwalletError2Embed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`${authorName}'s portfolio`)
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setDescription("The wallet address " + "**" + walletAddress + "**" + " is already registered in your portfolio.")
                                            .setThumbnail(userAvatar)
                                            .setTimestamp()
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [setwalletError2Embed] });

                                    }




                                } else if (walletUserAll.length > 23) {

                                    const setwalletError3Embed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s portfolio`)
                                        .setDescription(`The wallet can't be set, ${authorName}'s portfolio already reached its maximum capacity of 24 wallets.`)
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    return await interaction.editReply({ embeds: [setwalletError3Embed] });

                                }




                            } else if (subcommand === 'raw') {


                                //Variable pour les options
                                const selectedList = interaction.options.getString("wallet-list");
                                const attachment = interaction.options.getAttachment("csv");
                                const selectedSheet = interaction.options.getString("google-sheet");




                                if ((selectedList && !attachment && !selectedSheet) || (!selectedList && attachment && !selectedSheet) || (!selectedList && !attachment && selectedSheet)) {


                                    if (attachment) {

                                        let csvUrl = attachment.url;

                                        let walletTable = []
                                        let walletAddresses = [];


                                        const response = await axios.get(csvUrl, { responseType: 'text' });
                                        const csvData = response.data;

                                        let processingComplete = false; // Variable pour suivre l'état de la boucle

                                        csv.parseString(csvData, { headers: true })
                                            .on('data', row => {
                                                // Traitement des données de chaque ligne du CSV
                                                const walletInfo = Object.values(row)[0];
                                                const addresses = walletInfo.split(';')[0];
                                                const addressArray = addresses.split(',');

                                                for (const address of addressArray) {
                                                    const trimmedAddress = address.trim();
                                                    if (isValidEthereumAddress(trimmedAddress) || isBRC20BitcoinWallet(trimmedAddress) || isENS(trimmedAddress)) {
                                                        walletAddresses.push(trimmedAddress.toLowerCase());
                                                    }
                                                }
                                            })
                                            .on('end', () => {
                                                processingComplete = true; // La boucle est terminée
                                            })
                                            .on('error', error => {
                                                console.error('Erreur lors de la récupération du fichier CSV :', error);
                                                processingComplete = true; // La boucle est terminée en cas d'erreur
                                            });

                                        // Attendre que la boucle soit terminée
                                        while (!processingComplete) {
                                            await new Promise(resolve => setTimeout(resolve, 100)); // Attendre 100 ms avant de vérifier à nouveau
                                        }

                                        console.log(walletAddresses);

                                        const uniqueWalletAddresses = [...new Set(walletAddresses)];



                                        const walletUserAll = await wallets.findAll({ where: { authorId: authorId } })


                                        const registeredWalletLength = walletUserAll.length
                                        const walletLength = uniqueWalletAddresses.length
                                        const walletAvailable = 24 - registeredWalletLength

                                        let ethWallets = 0
                                        let btcWallets = 0


                                        if (walletUserAll.length <= 23) {


                                            let walletIndex = 0
                                            let walletNumber = 0
                                            let newWalletRegistered = []

                                            for (const wallet of uniqueWalletAddresses) {


                                                const walletExists = await wallets.findOne({ where: { authorId: authorId, walletAddress: wallet.toLowerCase() } })


                                                if (walletIndex < walletAvailable) {

                                                    if (!walletExists) {



                                                        if (isValidEthereumAddress(wallet)) {

                                                            newWalletRegistered.push(wallet)


                                                            ethWallets++
                                                            walletIndex++
                                                            walletNumber++


                                                            await wallets.create({
                                                                authorId: authorId.toString(),
                                                                walletName: ("Wallet " + (registeredWalletLength + walletNumber)).toString(),
                                                                walletAddress: wallet.toString(),
                                                                walletCategory: "eth",
                                                                authorUsername: authorName.toString(),

                                                            })


                                                        } else if (isBRC20BitcoinWallet(wallet)) {

                                                            newWalletRegistered.push(wallet)


                                                            btcWallets++
                                                            walletIndex++
                                                            walletNumber++


                                                            await wallets.create({
                                                                authorId: authorId.toString(),
                                                                walletName: ("Wallet " + (registeredWalletLength + walletNumber)).toString(),
                                                                walletAddress: wallet.toString(),
                                                                walletCategory: "btc",
                                                                authorUsername: authorName.toString(),

                                                            })


                                                        } else if (isENS(wallet)) {



                                                            let ensToWallet = "0x0000000000000000000000000000000000000000"

                                                            try {


                                                                ensToWallet = await web3CloudflarePublic.eth.ens.getOwner(wallet.toLowerCase())

                                                            } catch (error) {


                                                            }

                                                            console.log("wallet   ----> " + ensToWallet)
                                                            console.log("is valid ? Yes/no ---> " + isValidEthereumAddress(ensToWallet))



                                                            if (isValidEthereumAddress(ensToWallet) && ensToWallet !== "0x0000000000000000000000000000000000000000") {



                                                                const walletExists2 = await wallets.findOne({ where: { authorId: authorId, walletAddress: ensToWallet.toLowerCase() } })

                                                                if (!walletExists2) {

                                                                    newWalletRegistered.push(wallet)


                                                                    ethWallets++
                                                                    walletIndex++
                                                                    walletNumber++


                                                                    await wallets.create({
                                                                        authorId: authorId,
                                                                        walletName: wallet.toLowerCase(),
                                                                        walletAddress: ensToWallet.toLowerCase(),
                                                                        walletCategory: "eth",
                                                                        authorUsername: authorName,

                                                                    })





                                                                }
                                                            }



                                                        } else if (isSATS(wallet)) {

                                                            let satsToWallet = "0"

                                                            try {


                                                                const satsToWalletCall = await axios.get("https://api.sats.id/names/" + walletAddress.toLowerCase())
                                                                satsToWallet = satsToWalletCall.data.owner

                                                            } catch (error) { }




                                                            if (isBRC20BitcoinWallet(satsToWallet) && satsToWallet !== "0") {



                                                                const walletExists3 = await wallets.findOne({ where: { authorId: authorId, walletAddress: satsToWallet.toLowerCase() } })

                                                                if (!walletExists3) {


                                                                    newWalletRegistered.push(wallet)

                                                                    btcWallets++
                                                                    walletIndex++
                                                                    walletNumber++





                                                                    await wallets.create({
                                                                        authorId: authorId,
                                                                        walletName: wallet.toLowerCase(),
                                                                        walletAddress: satsToWallet.toLowerCase(),
                                                                        walletCategory: "btc",
                                                                        authorUsername: authorName,

                                                                    })




                                                                }
                                                            }
                                                        }
                                                    }

                                                    //

                                                }

                                            }



                                            //On prépare l'affichage !


                                            let walletDisplayLimit = 0
                                            let walletCreatedList = ""


                                            // On classe le tableau pour mettre les ENS avant
                                            newWalletRegistered.sort((a, b) => {
                                                const isAENS = isENS(a);
                                                const isBENS = isENS(b);

                                                if (isAENS && !isBENS) {
                                                    return -1; // Place a avant b
                                                } else if (!isAENS && isBENS) {
                                                    return 1; // Place b avant a
                                                } else {
                                                    return 0; // Maintient l'ordre actuel
                                                }
                                            });



                                            for (const address of newWalletRegistered) {


                                                if (walletDisplayLimit < 19) {

                                                    if (isValidEthereumAddress(address) || isENS(address) || isSATS(address)) {

                                                        walletCreatedList += address + ",        \n"


                                                    } else if (isBRC20BitcoinWallet(address)) {

                                                        walletCreatedList += address.substring(0, 39) + "...,        \n"

                                                    }


                                                } else if (walletDisplayLimit === 19) {

                                                    walletCreatedList += "and " + (walletNumber - 19) + " more..."

                                                } else if (walletDisplayLimit > 19) {



                                                }
                                                walletDisplayLimit += 1


                                            }


                                            generationStatut = "`Succeed`"


                                            if (walletCreatedList == "") { walletCreatedList = "None of the wallet has been added" }


                                            const walletGenerator = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Wallet Generator")
                                                .setDescription(">>> `" + walletNumber + "` wallets out of `" + walletLength + "` have been successfully set in your portfolio.")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: "New Wallets", value: "`" + walletNumber + "`", inline: true },
                                                    { name: "ETH Wallets", value: "`" + ethWallets + "`", inline: true },
                                                    { name: "BTC Wallets", value: "`" + btcWallets + "`", inline: true },
                                                    { name: "Wallets Set:", value: "```" + walletCreatedList + "```", inline: false },
                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [walletGenerator] });








                                        } else if (walletUserAll.length > 23) {

                                            const setwalletError3Embed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`${authorName}'s portfolio`)
                                                .setDescription(`The wallets can't be set, ${authorName}'s portfolio already reached its maximum capacity of 24 wallets.`)
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            return await interaction.editReply({ embeds: [setwalletError3Embed] });

                                        }


                                    } else if (selectedList) {



                                        const separators = /[ ,/:;-]/;
                                        const projects = selectedList.split(separators);

                                        let walletAddresses = []
                                        for (const wallet of projects) {

                                            if (isValidEthereumAddress(wallet) || isBRC20BitcoinWallet(wallet) || isENS(wallet)) {

                                                walletAddresses.push(wallet.toLowerCase())
                                            }
                                        }

                                        const uniqueWalletAddresses = [...new Set(walletAddresses)];
                                        console.log(uniqueWalletAddresses)

                                        const walletUserAll = await wallets.findAll({ where: { authorId: authorId } })


                                        const registeredWalletLength = walletUserAll.length
                                        const walletLength = uniqueWalletAddresses.length
                                        const walletAvailable = 24 - registeredWalletLength

                                        let ethWallets = 0
                                        let btcWallets = 0


                                        if (walletUserAll.length <= 23) {


                                            let walletIndex = 0
                                            let walletNumber = 0
                                            let newWalletRegistered = []

                                            for (const wallet of uniqueWalletAddresses) {


                                                const walletExists = await wallets.findOne({ where: { authorId: authorId, walletAddress: wallet.toLowerCase() } })


                                                if (walletIndex < walletAvailable) {

                                                    if (!walletExists) {



                                                        if (isValidEthereumAddress(wallet)) {

                                                            newWalletRegistered.push(wallet)


                                                            ethWallets++
                                                            walletIndex++
                                                            walletNumber++


                                                            await wallets.create({
                                                                authorId: authorId.toString(),
                                                                walletName: ("Wallet " + (registeredWalletLength + walletNumber)).toString(),
                                                                walletAddress: wallet.toString(),
                                                                walletCategory: "eth",
                                                                authorUsername: authorName.toString(),

                                                            })


                                                        } else if (isBRC20BitcoinWallet(wallet)) {

                                                            newWalletRegistered.push(wallet)


                                                            btcWallets++
                                                            walletIndex++
                                                            walletNumber++


                                                            await wallets.create({
                                                                authorId: authorId.toString(),
                                                                walletName: ("Wallet " + (registeredWalletLength + walletNumber)).toString(),
                                                                walletAddress: wallet.toString(),
                                                                walletCategory: "btc",
                                                                authorUsername: authorName.toString(),

                                                            })


                                                        } else if (isENS(wallet)) {



                                                            let ensToWallet = "0x0000000000000000000000000000000000000000"

                                                            try {


                                                                ensToWallet = await web3CloudflarePublic.eth.ens.getOwner(wallet.toLowerCase())

                                                            } catch (error) {


                                                            }

                                                            console.log("wallet   ----> " + ensToWallet)
                                                            console.log("is valid ? Yes/no ---> " + isValidEthereumAddress(ensToWallet))



                                                            if (isValidEthereumAddress(ensToWallet) && ensToWallet !== "0x0000000000000000000000000000000000000000") {



                                                                const walletExists2 = await wallets.findOne({ where: { authorId: authorId, walletAddress: ensToWallet.toLowerCase() } })

                                                                if (!walletExists2) {

                                                                    newWalletRegistered.push(wallet)


                                                                    ethWallets++
                                                                    walletIndex++
                                                                    walletNumber++


                                                                    await wallets.create({
                                                                        authorId: authorId,
                                                                        walletName: wallet.toLowerCase(),
                                                                        walletAddress: ensToWallet.toLowerCase(),
                                                                        walletCategory: "eth",
                                                                        authorUsername: authorName,

                                                                    })





                                                                }
                                                            }

                                                        } else if (isSATS(wallet)) {

                                                            let satsToWallet = "0"

                                                            try {


                                                                const satsToWalletCall = await axios.get("https://api.sats.id/names/" + walletAddress.toLowerCase())
                                                                satsToWallet = satsToWalletCall.data.owner

                                                            } catch (error) { }




                                                            if (isBRC20BitcoinWallet(satsToWallet) && satsToWallet !== "0") {



                                                                const walletExists3 = await wallets.findOne({ where: { authorId: authorId, walletAddress: satsToWallet.toLowerCase() } })

                                                                if (!walletExists3) {


                                                                    newWalletRegistered.push(wallet)

                                                                    btcWallets++
                                                                    walletIndex++
                                                                    walletNumber++





                                                                    await wallets.create({
                                                                        authorId: authorId,
                                                                        walletName: wallet.toLowerCase(),
                                                                        walletAddress: satsToWallet.toLowerCase(),
                                                                        walletCategory: "btc",
                                                                        authorUsername: authorName,

                                                                    })




                                                                }
                                                            }
                                                        }

                                                        //
                                                    }



                                                }

                                            }



                                            //On prépare l'affichage !


                                            let walletDisplayLimit = 0
                                            let walletCreatedList = ""


                                            // On classe le tableau pour mettre les ENS avant
                                            newWalletRegistered.sort((a, b) => {
                                                const isAENS = isENS(a);
                                                const isBENS = isENS(b);

                                                if (isAENS && !isBENS) {
                                                    return -1; // Place a avant b
                                                } else if (!isAENS && isBENS) {
                                                    return 1; // Place b avant a
                                                } else {
                                                    return 0; // Maintient l'ordre actuel
                                                }
                                            });



                                            for (const address of newWalletRegistered) {


                                                if (walletDisplayLimit < 19) {

                                                    if (isValidEthereumAddress(address) || isENS(address) || isSATS(address)) {

                                                        walletCreatedList += address + ",        \n"


                                                    } else if (isBRC20BitcoinWallet(address)) {

                                                        walletCreatedList += address.substring(0, 39) + "...,        \n"

                                                    }


                                                } else if (walletDisplayLimit === 19) {

                                                    walletCreatedList += "and " + (walletNumber - 19) + " more..."

                                                } else if (walletDisplayLimit > 19) {



                                                }
                                                walletDisplayLimit += 1


                                            }


                                            generationStatut = "`Succeed`"


                                            if (walletCreatedList == "") { walletCreatedList = "None of the wallet has been added" }


                                            const walletGenerator = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle("Wallet Generator")
                                                .setDescription(">>> `" + walletNumber + "` wallets out of `" + walletLength + "` have been successfully set in your portfolio.")
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .addFields(
                                                    { name: "New Wallets", value: "`" + walletNumber + "`", inline: true },
                                                    { name: "ETH Wallets", value: "`" + ethWallets + "`", inline: true },
                                                    { name: "BTC Wallets", value: "`" + btcWallets + "`", inline: true },
                                                    { name: "Wallets Set:", value: "```" + walletCreatedList + "```", inline: false },
                                                )
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                            await interaction.editReply({ embeds: [walletGenerator] });








                                        } else if (walletUserAll.length > 23) {

                                            const setwalletError3Embed = new EmbedBuilder().setColor("#060A8F")
                                                .setTitle(`${authorName}'s portfolio`)
                                                .setDescription(`The wallets can't be set, ${authorName}'s portfolio already reached its maximum capacity of 24 wallets.`)
                                                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                                .setAuthor({ name: authorName, iconURL: userAvatar })
                                                .setTimestamp()
                                                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                            return await interaction.editReply({ embeds: [setwalletError3Embed] });

                                        }











                                    } else if (selectedSheet) {

                                        const availableInTheNearFuture = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`${authorName}'s wallet`)
                                            .setDescription("The google sheet option you try to use is currently being built and will be available in the near future. You can still use all the other commands in the meantime, as well as the other options of `wallet raw`.")
                                            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                            .setTimestamp()
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                        await interaction.editReply({ embeds: [availableInTheNearFuture] });


                                    }



                                } else {

                                    const notMember = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`Options Selection`)
                                        .setDescription("This command allows only one option to be selected. You have to pick one option between `csv`, `wallet-list` and `google-sheet`, no more, no less.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [notMember] });


                                }

                            } else if (subcommand === 'get') {

                                const buttonAllAvailable = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletfirstpage-button')
                                            .setLabel('first page')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletpreviouspage-button')
                                            .setLabel('previous page')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletnextpage-button')
                                            .setLabel('next page')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletlastpage-button')
                                            .setLabel('last page')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId('getwalletsswitchchain-button')
                                            .setEmoji("<:RCBTC:1123219824282189834>")
                                            .setStyle(3),

                                    );

                                const buttonOnePage = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletfirstpage-button')
                                            .setLabel('first page')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletpreviouspage-button')
                                            .setLabel('previous page')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletnextpage-button')
                                            .setLabel('next page')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('zzzgetwalletlastpage-button')
                                            .setLabel('last page')
                                            .setStyle(2)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId('getwalletsswitchchain-button')
                                            .setEmoji("<:RCBTC:1123219824282189834>")
                                            .setStyle(3),

                                    );


                                const buttonShowName = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('getwalletshowname-button')
                                            .setLabel('show wallet names')
                                            .setStyle(1)


                                    );



                                //On défini et crée la liste des wallets
                                let allWalletAddressOfAuthorTable = []
                                const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId } });

                                if (allWalletsOfAuthor.length > 0) {


                                    // Prix de l'ETH
                                    const ethUsdPrice = getEthPrice()

                                    const btcCallPrice = await axios.get("https://blockchain.info/q/24hrprice")
                                    const BTCUsdPrice = btcCallPrice.data


                                    let totalValue = 0
                                    let totalValueBTC = 0


                                    //On crée le tableau final
                                    for (let i = 0; i < allWalletsOfAuthor.length; i++) {

                                        let obj = {}
                                        obj.walletAddress = allWalletsOfAuthor[i].dataValues.walletAddress
                                        obj.walletName = allWalletsOfAuthor[i].dataValues.walletName

                                        if (isValidEthereumAddress(allWalletsOfAuthor[i].dataValues.walletAddress)) {

                                            obj.walletChain = 'eth'

                                        } else if (isBRC20BitcoinWallet(allWalletsOfAuthor[i].dataValues.walletAddress)) {

                                            obj.walletChain = 'btc'
                                        }

                                        allWalletAddressOfAuthorTable.push(obj)

                                    }

                                    const filteredByWalletETH = allWalletAddressOfAuthorTable.filter(item => item.walletChain == 'eth');
                                    const walletAddresses = filteredByWalletETH.map(item => item.walletAddress);
                                    const callArrayETH = walletAddresses.join(',');
                                    const balanceMultiCall = await axios.get("https://api.etherscan.io/api?module=account&action=balancemulti&address=" + callArrayETH + "&tag=latest&apikey=" + etherscanApiKey)

                                    const filteredByWalletBTC = allWalletAddressOfAuthorTable.filter(item => item.walletChain == 'btc');
                                    const walletAddressesBTC = filteredByWalletBTC.map(item => item.walletAddress);
                                    const callArrayBTC = walletAddressesBTC.join('|');
                                    const balanceMultiCallBTC = await axios.get("https://blockchain.info/balance?active=" + callArrayBTC)


                                    allWalletAddressOfAuthorTable.forEach(obj => {
                                        if (obj.walletChain === 'eth') {
                                            const ethBalanceObj = (balanceMultiCall.data.result).find(balanceObj => balanceObj.account === obj.walletAddress);
                                            if (ethBalanceObj || ethBalanceObj == 0) {
                                                obj.balance = parseFloat((ethBalanceObj.balance) / (10 ** 18)).toFixed(3);
                                                totalValue += (ethBalanceObj.balance) / (10 ** 18)
                                            } else {
                                                obj.balance = "0.000"
                                            }
                                        } else if (obj.walletChain === 'btc') {
                                            const btcBalanceObj = balanceMultiCallBTC.data[obj.walletAddress];
                                            if (btcBalanceObj || btcBalanceObj == 0) {
                                                obj.balance = parseFloat((btcBalanceObj.final_balance) / (10 ** 8)).toFixed(3);
                                                totalValueBTC += (btcBalanceObj.final_balance) / (10 ** 8)
                                            } else {
                                                obj.balance = "0.000"
                                            }
                                        }
                                    });


                                    allWalletAddressOfAuthorTable.sort((a, b) => {
                                        // Trier par walletChain (eth en premier, puis btc)
                                        if (a.walletChain !== b.walletChain) {
                                            if (a.walletChain === 'eth') return -1;
                                            if (b.walletChain === 'eth') return 1;
                                        }

                                        // Pour les objets ayant la même walletChain, trier par balance (du plus grand au plus petit)
                                        if (a.balance !== b.balance) {
                                            return b.balance - a.balance;
                                        }

                                        // Si les walletChain et balance sont identiques, maintenir l'ordre d'origine
                                        return 0;
                                    });

                                    console.log(allWalletAddressOfAuthorTable)
                                    console.log(totalValue)
                                    console.log(totalValueBTC)



                                    let walletCount = filteredByWalletETH.length
                                    let pageIndex = ""
                                    let actualPage = 1

                                    if (walletCount / 8 <= 1) { pageIndex = 1 }
                                    if (walletCount / 8 > 1) { pageIndex = 2 }
                                    if (walletCount / 8 > 2) { pageIndex = 3 }






                                    //On définit la base de l'embed
                                    const getwalletsAllEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s portfolio`)
                                        .setDescription(`>>> All the Ethereum wallets registered in ${authorName}'s portfolio`)
                                        .addFields(
                                            { name: ' ', value: " ", inline: false },
                                            { name: 'ETH Wallets', value: "`" + walletCount + " addresses`", inline: true },
                                            { name: 'Total Balance', value: "`" + parseFloat(totalValue).toFixed(3) + "Ξ (" + new Intl.NumberFormat('en-US').format(parseFloat(totalValue * ethUsdPrice).toFixed(2)) + "$)`", inline: true },
                                        ).setTimestamp()
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })





                                    let fieldCount = 0
                                    let embed1Field = ""




                                    for (const object of allWalletAddressOfAuthorTable) {

                                        if (object.walletChain == "eth") {
                                            let sign = "Ξ"

                                            if (fieldCount < 8) {


                                                let lignMaxSize = 70
                                                let leftPartNfts = "`" + (formatString(object.walletAddress)).toLowerCase()
                                                let rightPartNfts = object.balance + sign + "`\n"
                                                let leftPartNFTsLenght = leftPartNfts.length
                                                let rightPartNftsLenght = rightPartNfts.length
                                                let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
                                                let spaceLenght = ""
                                                for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


                                                embed1Field += "`" + (formatString(object.walletAddress)).toLowerCase() + spaceLenght + object.balance + sign + "`\n"




                                                if (fieldCount == 7 || fieldCount === (walletCount - 1)) {

                                                    console.log("ici")

                                                    if (embed1Field == "") { embed1Field = "```No Ethereum wallet are registered```" }

                                                    getwalletsAllEmbed.addFields(
                                                        { name: 'Wallets:', value: embed1Field, inline: false },

                                                    );


                                                    getwalletsAllEmbed.addFields(
                                                        { name: 'Page', value: "`[1/" + pageIndex + "]`", inline: false },
                                                    )

                                                }


                                            }
                                            fieldCount++
                                        }
                                    }

                                    if (embed1Field == "") {
                                        embed1Field = "```No Ethereum wallet is registered in your portfolio.```"

                                        getwalletsAllEmbed.addFields(
                                            { name: 'Wallets:', value: embed1Field, inline: false },

                                        );


                                        getwalletsAllEmbed.addFields(
                                            { name: 'Page', value: "`[1/" + pageIndex + "]`", inline: false },
                                        )
                                    }



                                    /////
                                    //Faire les boutons inactifs ici 


                                    if (pageIndex == 1) {

                                        await interaction.editReply({ embeds: [getwalletsAllEmbed], components: [buttonOnePage, buttonShowName] })

                                    } else if (pageIndex > 1) {

                                        await interaction.editReply({ embeds: [getwalletsAllEmbed], components: [buttonAllAvailable, buttonShowName] })

                                    }

                                    /////


                                    let walletsInfos = []
                                    let object = {}
                                    object.walletCountETH = filteredByWalletETH.length
                                    object.walletCountBTC = filteredByWalletBTC.length
                                    object.valueETH = totalValue
                                    object.valueBTC = totalValueBTC
                                    object.priceETH = ethUsdPrice
                                    object.priceBTC = BTCUsdPrice
                                    walletsInfos.push(object)


                                    //On fait le call àbn  la base SQL
                                    await interactionData.destroy({ where: { authorId: authorId, commandName: "getwallet", serverId: serverId } })

                                    await interactionData.create({

                                        authorId: authorId,
                                        authorName: authorName,
                                        serverId: serverId,
                                        commandName: "getwallet",
                                        interactionId: interaction.id,
                                        walletAddress: "N/A",
                                        walletCategory: "eth",
                                        embed1: JSON.stringify(allWalletAddressOfAuthorTable),
                                        embed2: JSON.stringify(walletsInfos),
                                        embed3: "N/A",
                                        pageIndex: pageIndex.toString(),
                                        actualPage: "1",
                                        walletName: "no",
                                        selecedTimestamp: "N/A",
                                        selectedCollection: "N/A",
                                        collectionSlug: "N/A",
                                        collectionBanner: "N/A",
                                        avgDeriskPrice: "N/A",
                                        floorPrice: "N/A",
                                        lowerMarketlace: "N/A",
                                        collectionName: "N/A",
                                        buyCount: "N/A",
                                        soldCount: "N/A",
                                        remaining: "N/A",
                                        avgBuy: "N/A",
                                        avgSold: "N/A",
                                        realisedProfit: "N/A",
                                        potentialProfit: "N/A",
                                        roi: "N/A",
                                        visualTitle: "N/A",
                                        userAvatar: "N/A",
                                        nbMembersInvolved: "N/A",
                                        totalTradeCount: "N/A",
                                    })



                                } else {

                                    const botOff = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s portfolio`)
                                        .setDescription("Your portfolio is empty, both on Ethereum and Bitcoin. To set a wallet in your portfolio, you can use `/wallet set` or `/wallet raw`. To set multiple wallets at once, you can use `/setwalletraw`.")
                                        .setThumbnail(userAvatar)
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setTimestamp()
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                    await interaction.editReply({ embeds: [botOff] });


                                }


                            } else if (subcommand === 'remove') {


                                const walletAddress = interaction.options.getString("wallet");
                                const choices = await wallets.findOne({ where: { walletAddress: walletAddress } })



                                // A FAIRE == Si le choix dans "wallet" est mauvais (wallet existe pas)
                                if (!choices && walletAddress.toLowerCase() !== "all") {


                                    const removewalletInvalidwalletEmbed = new EmbedBuilder().setColor("#060A8F")
                                        .setTitle(`${authorName}'s portfolio`)
                                        .setDescription("The walet you try to remove isn't registered in your portfolio. Please select a valid wallet.")
                                        .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                                        .setTimestamp()
                                        .setAuthor({ name: authorName, iconURL: userAvatar })
                                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                    await interaction.editReply({ embeds: [removewalletInvalidwalletEmbed] });


                                    // A FAIRE == Si le choix dans "wallet" est bon (wallet existe)
                                } else if (choices || walletAddress.toLowerCase() == "all") {

                                    // A FAIRE == Méchanisme de remove all
                                    if (walletAddress.toLowerCase() === "all") {

                                        await wallets.destroy({ where: { authorId: authorId } })

                                        const removewalletAllWalletEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`${authorName}'s portfolio`)
                                            .setDescription(`All wallets of ${authorName}'s portfolio have been removed.`)
                                            .setThumbnail(userAvatar)
                                            .setTimestamp()
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                                        await interaction.editReply({ embeds: [removewalletAllWalletEmbed] });


                                        // A FAIRE == Méchanisme de remove Wallet précis
                                    } else if (walletAddress.toLowerCase() !== "all") {


                                        const walletremoved = await wallets.findOne({ where: { authorId: authorId, walletAddress: walletAddress } })

                                        let walletCategoryFormatted = "Ethereum"
                                        if (walletremoved.walletCategory == "btc") { walletCategoryFormatted = "Bitcoin" }

                                        const removewalletwalletAddressEmbed = new EmbedBuilder().setColor("#060A8F")
                                            .setTitle(`${authorName}'s portfolio`)
                                            .setDescription(`>>> The wallet has been removed from ${authorName}'s portfolio.`)
                                            .setThumbnail(userAvatar)
                                            .setTimestamp()
                                            .setAuthor({ name: authorName, iconURL: userAvatar })
                                            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
                                            .addFields(
                                                { name: 'Name', value: walletremoved.walletName, inline: true },
                                                { name: 'Wallet', value: walletremoved.walletAddress.substring(0, 5) + "..." + walletremoved.walletAddress.substring(walletremoved.walletAddress.length - 4, walletremoved.walletAddress.length), inline: true },
                                                { name: 'Type', value: walletCategoryFormatted, inline: true },
                                            );

                                        await wallets.destroy({ where: { authorId: authorId, walletAddress: walletAddress } })

                                        await interaction.editReply({ embeds: [removewalletwalletAddressEmbed] });


                                    }
                                }
                                // Si "category" est séléctionné et pas "wallet".



                            } else if (subcommand === 'generate') {

                                let walletNumber = interaction.options.getString("count");

                                let walletTable = []
                                let walletCreatedList = ""
                                let generationStatut = "`Failed`"





                                for (let i = 0; i < walletNumber; i++) {

                                    const wallet = web3CloudflarePublic.eth.accounts.create();

                                    walletTable.push(wallet);


                                }

                                const filteredWalletTable = walletTable.map(obj => ({ address: obj.address, privateKey: obj.privateKey, authorId: authorId }));
                                const filteredWalletAddresses = walletTable.map(obj => obj.address);

                                await walletsgenerated.destroy({ where: { authorId: authorId } })

                                for (let i = 0; i < filteredWalletTable.length; i++) {

                                    await walletsgenerated.create({

                                        authorId: filteredWalletTable[i].authorId,
                                        walletAddress: encrypt(filteredWalletTable[i].address),
                                        privateKey: encrypt(filteredWalletTable[i].privateKey),

                                    })

                                }

                                let walletDisplayLimit = 0

                                for (const address of filteredWalletAddresses) {


                                    if (walletDisplayLimit < 19) {

                                        walletCreatedList += address + ",        \n"

                                    } else if (walletDisplayLimit === 19) {

                                        walletCreatedList += "and " + (walletNumber - 19) + " more..."

                                    } else if (walletDisplayLimit > 19) {



                                    }
                                    walletDisplayLimit += 1


                                }


                                generationStatut = "`Succeed`"







                                const walletUserAll = await wallets.findAll({ where: { authorId: authorId } })

                                const registeredWalletLength = walletUserAll.length
                                // const walletTableLength = walletsTable.length
                                // const walletLength = uniqueWalletAddresses.length
                                const walletAvailable = 24 - registeredWalletLength





                                let buttonsRow = ''
                                let walletAvailableButton = 24 - registeredWalletLength
                                if (walletNumber < walletAvailableButton) { walletAvailableButton = walletNumber }

                                if (walletAvailable > 0) {

                                    buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('download-button')
                                                .setLabel('Download CSV')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId('walletgeneratoraddwallets-button')
                                                .setLabel('Add ' + walletAvailableButton + " wallets")
                                                .setStyle(2),
                                            // new ButtonBuilder()
                                            //   .setCustomId('walletmanagermenu-button')
                                            //   .setLabel('menu')
                                            //   .setStyle(2), 

                                        );

                                } else {


                                    buttonsRow = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId('download-button')
                                                .setLabel('Download CSV')
                                                .setStyle(2),
                                            // new ButtonBuilder()
                                            //   .setCustomId('walletmanagermenu-button')
                                            //   .setLabel('menu')
                                            //   .setStyle(2), 

                                        );

                                }



                                const walletGenerator = new EmbedBuilder().setColor("#060A8F")
                                    .setTitle("Wallet Generator")
                                    .setDescription(">>> `" + walletNumber + "` wallets have been successfully generated")
                                    .setAuthor({ name: authorName, iconURL: userAvatar })
                                    .setTimestamp()
                                    .addFields(
                                        { name: "Wallet Count", value: "`" + walletNumber + "`", inline: true },
                                        { name: "Network", value: "`Ethereum (ETH)`", inline: true },
                                        { name: "Generation Status", value: generationStatut, inline: true },
                                        { name: "Wallets Created:", value: "```" + walletCreatedList + "```", inline: false },
                                    )
                                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                                await interaction.editReply({ embeds: [walletGenerator], components: [buttonsRow] });



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
                let reportCommand = "/wallet"

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

