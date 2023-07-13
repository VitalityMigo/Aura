/**
 * @file Default Error Message On Error Modal Interaction
 * @author JAYZHVJ
 * @since 3.2.0
 */

module.exports = {
	/**
	 * @description Executes when the modal interaction could not be fetched.
	 * @author JAYZHVJ
	 * @param {import('discord.js').ModalSubmitInteraction} interaction The Interaction Object of the command.
	 */

	async execute(interaction) {
		await interaction.reply({
			content: "An error occured. Please try again. If the error persists, feel free to contact one of our team member.",
			ephemeral: true,
		});
		return;
	},
};
