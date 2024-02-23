const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { authBlur } = require("./1nft-utils")
const markets = require("../contracts/nft/config.json")

async function errorHandler(interaction, message, settings) {

    const code = message.code

    // Data du user
    const authorId = interaction.user.id;
    const authorName = interaction.user.username;
    const userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;


    if (code === 'marketplace') {
        // La marketplace n'est pas supporté

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("The floor is currently on a non-supported marketplace. Please use 🔫 *Snipe* on the trading panel to buy a precise token out of Blur or Opensea.")
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


    } else if (code === 'error') {

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("An error occured while generating your trade. Please try again or contact a team member if the issue persists.")
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


    } else if (code === 'auth') {

        console.log("Faire la boucle d'auth...")

        // On envoi la première réponse
        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("First, we need to authentificate your account to Blur, please hold on a few seconds <a:AuraLoading:1134068847616458792>\n\n*__NB:__ Logging on to Blur is an essential step that should be done about once a month.*")
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });


        // On récupère l'auth Blur
        const auth = await authBlur(message, settings, authorId)


        if (auth !== null) {

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("NFT Trading")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("Logged on to Blur succesfully, you can now use the trading panel again. Blur usually asks to do that step about once a month ✅")
                .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });



        } else {

            // Boutton pas de wallet
            const blurButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('button_nft_infra_blurAuth')
                        .setLabel('Enter token')
                        .setStyle(1),
                );

            const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                .setTitle("NFT Trading")
                .setAuthor({ name: authorName, iconURL: userAvatar })
                .setDescription("An error occured while authentificating to Blur. To continue, please follow the steps below to get your Blur auth token:\n\n• Go to your portfolio at [Blur.io](https://blur.io/portfolio).\n• Once loaded, right click and select **Inspect**.\n• Select the **Network** tab in the console, and refresh the page once done.\n• Select one of the tabs named **prices**.\n• Your auth token is in the section named **Cookie** as below.\n\nPlease registrer this auth token by using the button below ⬇️.")
                .setImage('https://media.discordapp.net/attachments/1100572519896977490/1205946866357899304/Group_72.png?ex=65da388a&is=65c7c38a&hm=d9d48653acdb509927386398d9c6a48daf683d2bce1f7cf74d9b8a59522e6720&=&format=webp&quality=lossless&width=2182&height=1106')
                .setTimestamp()
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

            await interaction.editReply({ embeds: [setfpEmbedNotForYou], components: [blurButton], ephemeral: true });


        }

    } else if (code === 'listingAvailability') {
        // Le listing n'est pas disponible, soit le token n'existe pas, soit il n'est pas listé

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("The token `#" + message.token + "` can't be bought. This means that the token is not listed or does not exist. Please make sure the token is listed.")
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

    } else if (code === 'wrap') {
        // Ici on pourrait faire un code automatique pour le faire aussi si ça a été mal fait
        // On récupère la source
        const source = markets.find(i => i.id === message.source)

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("The bid was not created because your wrapped funds (" + source.poolSymbol + ") are not sufficient. To continue, please follow the steps below to wrap your funds :\n\n• Go to the " + source.poolSymbol + " contract at [Etherscan.io](https://etherscan.io/address/" + source.pool + ").\n• Once loaded, go to the **Contract** tab, then to **Write Contract**.\n• Click on **Connect to Web3** and connect your wallet.\n• Select the **deposit** function and input the amount of funds to wrap.\n• Approve the wrap by clicking on **Write**.\n\nYour funds are now wrapped, you can create a bid using the trading panel ⬆️.")
            .setImage('https://media.discordapp.net/attachments/1100572519896977490/1209201551080427600/wrap.png?ex=65e60fb3&is=65d39ab3&hm=c982cf3af8a288e91dd66e7f74f219583ea0833430dfb8c29cdd8f41250e0198&=&format=webp&quality=lossless&width=2206&height=834')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

    } else if (code === 'wrap-approval') {
        // Ici on pourrait faire un code automatique pour le faire
        // On récupère la source
        const source = markets.find(i => i.id === message.source)

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("To execute this bid, you need to approve the wrapped fund (" + source.poolSymbol + "). To continue, please follow the steps below to approve the funds :\n\n• Go to the " + source.poolSymbol + " contract at [Etherscan.io](https://etherscan.io/address/" + source.pool + ").\n• Once loaded, go to the **Contract** tab, then to **Write Contract**.\n• Click on **Connect to Web3** and connect your wallet.\n• Select the **approve** function and input the marketplace address (guy) and the amount to approve in wei(wad).\n• Approve the wrapped funds by clicking on **Write**.\n\nYour wrapped funds are now approved, you can create a bid using the trading panel ⬆️.")
            .setImage('https://media.discordapp.net/attachments/1100572519896977490/1209199767192731698/Approve.png?ex=65e60e0a&is=65d3990a&hm=0d6f4854a2bcd3f5a213868d7eb4bf371f6de4fcd91449d559be672a6e4aad2b&=&format=webp&quality=lossless&width=2206&height=972')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

    } else if (code === 'balance') {
        // Ici on pourrait faire un code automatique pour le faire
        // On récupère la source
        const source = markets.find(i => i.id === message.source)

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("This bid can not be executed, your total balance (ETH + " + source.poolSymbol + ") isn't sufficient. To continue, please make sure your total balance is valid.")
            .setImage('https://media.discordapp.net/attachments/1100572519896977490/1209199767192731698/Approve.png?ex=65e60e0a&is=65d3990a&hm=0d6f4854a2bcd3f5a213868d7eb4bf371f6de4fcd91449d559be672a6e4aad2b&=&format=webp&quality=lossless&width=2206&height=972')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });

    } else if (code === 'eth-funds') {
        // Ici on pourrait faire un code automatique pour le faire
        // On récupère la source

        const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
            .setTitle("NFT Trading")
            .setAuthor({ name: authorName, iconURL: userAvatar })
            .setDescription("Your ETH balance is too low to execute this action. To continue, please make sure your balance is valid.")
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

        await interaction.editReply({ embeds: [setfpEmbedNotForYou], ephemeral: true });
    }
}

module.exports = {
    errorHandler
}