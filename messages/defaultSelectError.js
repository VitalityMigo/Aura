/**
 * @file Default Error Message On Error Select Menu Interaction
 * @author JAYZHVJ
 * @since 3.0.0
 */

module.exports = {
	/**
	 * @description Executes when the select menu interaction could not be fetched.
	 * @author JAYZHVJ
	 * @param {import('discord.js').SelectMenuInteraction} interaction The Interaction Object of the command.
	 */

	async execute(interaction) {
		await interaction.reply({
			content: "An error occured. Please try again. If the error persists, feel free to contact one of our team member.",
			ephemeral: true,
		});
		return;
	},
};
