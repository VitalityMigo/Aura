const { EmbedBuilder } = require("discord.js");

const client = require('../bot'); // Chemin vers le fichier client.js

client.once('ready', () => {
    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD
        serverId = "1108754348818845729";

    } else if (botId == "1119666128411709552") {
        // DEV
        serverId = "1071576735298113667";
    }

    botGuild = client.guilds.cache.get(serverId);

});

client.on('guildMemberAdd', async (member) => {

    try {

        const authorId = member.user.id
        const username = member.user.username

        const user = await botGuild.members.fetch(authorId);


        const memberEmbed = new EmbedBuilder().setColor("#060A8F")
            .setTitle("Aura Analytics")
            .setDescription("Hey " + username + ", welcome to Aura 💫.Come back here after completing the first verification.\n\n")
            .addFields(
                { name: " ", value: " ", inline: false },
                { name: "Want to know more about Aura ?", value: "You can visit our [documentation](https://aura-3.gitbook.io/aura), the tutorial section <#1162832027687587961>, or even read a short resume using `/guide`.", inline: false },
                { name: " ", value: " ", inline: false },
                { name: "Want to get access ?", value: "All the access are being granted in the access channel : <#1108757700885622784>. ", inline: false },
                { name: " ", value: " ", inline: false },
                { name: "Coming from one of our Friend Tech partner ?", value: "Feel free to visit <#1108757700885622784> and use the *Friend Tech* button to gain access to Aura.", inline: false },
                { name: " ", value: " ", inline: false },
                { name: "Need any help ?", value: "Our team is very reactive. If you have a question or encounter an issue, please let us know in the support section <#1108834062614925444>.", inline: false },
                { name: " ", value: " ", inline: false },
                { name: " ", value: "Happy trading !", inline: false },
                { name: " ", value: " ", inline: false },
                { name: 'Links', value: "[Gitbook](https://aura-3.gitbook.io/aura) ∙ [Twitter](https://twitter.com/AuraAnalytics) ∙ [Discord](https://discord.gg/nMKzzfR6gx) ∙ [Website](https://www.aurafinance.pro)", inline: false },


            )
            .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
            .setTimestamp()
            .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


        user.send({ embeds: [memberEmbed] });

    } catch (error) {
        console.log("Impossible d'envoyer le message d'entrée l'auteur")
    }

});
