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
				// .setAuthor({ name: "RC-Bot", iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png', url: 'https://twitter.com/jayzhvj_eth' })
				.setDescription("Error with the command !")
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
			await interaction.reply({
				embeds: [setfpEmbed],
			});
		}
	},
};
