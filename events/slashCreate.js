/**
 * @file Slash Command Interaction Handler
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.3.0
 */
const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: "interactionCreate",

	/**
	 * @description Executes when an interaction is created and handle it.
	 * @author JAYZHVJ
	 * @param {import('discord.js').CommandInteraction & { client: import('../typings').Client }} interaction The interaction which was created
	 */

	async execute(interaction) {
		// Deconstructed client from interaction object.
		const { client } = interaction;
		const setfpEmbed = new EmbedBuilder().setColor("#060A8F");

		// Checks if the interaction is a command (to prevent weird bugs)

		if (!interaction.isChatInputCommand()) return;

		const command = client.slashCommands.get(interaction.commandName);

		// If the interaction is not a command in cache.

		if (!command) return;

		// A try to executes the interaction.

		try {
			await command.execute(interaction);
		} catch (err) {
			console.error(err);
			setfpEmbed.setTitle(`Error`)
				// .setURL('https://magically.gg/collection/' + collection)
				// .setAuthor({ name: "RC-Bot", iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg', url: 'https://twitter.com/jayzhvj_eth' })
				.setDescription("Error with the command !")
				.setTimestamp()
				.setFooter({ text: 'Rolls Chasers Bot', iconURL: 'https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg' })
			await interaction.reply({
				embeds: [setfpEmbed],
			});
		}
	},
};
