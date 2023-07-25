/**
 * @file Default Bot Mention Command
 * @author JAYZHVJ
 * @since 3.0.0
 */

const { EmbedBuilder, SlashCommandBuilder, ApplicationCommandManager, ContextMenuCommandBuilder } = require("discord.js");
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
	/**
	 * @description Executes when the bot is pinged.
	 * @author JAYZHVJ
	 * @param {import('discord.js').Message} message The Message Object of the command.
	 */

	async execute(message) {


		let authorId = message.author.id;
        let authorName = message.author.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${message.author.avatar}.png`;

		const pingEmbed = new EmbedBuilder().setColor("#060A8F")
			.setTitle("Rolls Chasers Analytics")
			.setAuthor({ name: authorName, iconURL: userAvatar })
			.setDescription("Welcome to Aura\n\nTo start using analytics, use the `/` and select one of the command available. If you need any help, just type `/guide` or contact one of our team member.")
			.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
			.setTimestamp()
			.setFooter({ text: 'Rolls Chasers Analytics', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })

         await message.reply({ embeds: [pingEmbed] });



	},
};
