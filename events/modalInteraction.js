/**
 * @file Modal Interaction Handler
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.3.1
 */

const { InteractionType } = require("discord-api-types/v10");

module.exports = {
	name: "interactionCreate",

	/**
	 * @description Executes when an interaction is created and handle it.
	 * @author JAYZHVJ
	 * @param {import('discord.js').Interaction & { client: import('../typings').Client }} interaction The interaction which was created
	 */

	async execute(interaction) {
		// Deconstructed client from interaction object.
		const { client } = interaction;

		// Checks if the interaction is a modal interaction (to prevent weird bugs)

		if (!interaction.isModalSubmit()) return;

		let customId = interaction.customId
		let command = ""

		// On redirige vers les bons fichier dans le cas d'un exec (transfert de l'info)
		if (customId.startsWith("modal_friendtech_exec_buy_")) {
			command = client.modalCommands.get("modal_friendtech_exec_buy_");
		} else if (customId.startsWith("modal_friendtech_exec_sell_")) {
			command = client.modalCommands.get("modal_friendtech_exec_sell_");
		} else if (customId.startsWith("modal-friendtechtasksinfra-sniper-param-")) {
			command = client.modalCommands.get("modal-friendtechtasksinfra-sniper-param-");
		} else if (customId.startsWith("modal-friendtechtasksinfra-order-param-")) {
			command = client.modalCommands.get("modal-friendtechtasksinfra-order-param-");
		} else if (customId.startsWith("modal_friendtech_portfolio_exec_")) {
			command = client.modalCommands.get("modal_friendtech_portfolio_exec_");
		} else if (customId.startsWith("modal_infra_coin_walletsetup_")) {
			command = client.modalCommands.get("modal_infra_coin_walletsetup_");
		} else if (customId.startsWith("modal-friendtechtasksinfra-farmer-param-")) {
			command = client.modalCommands.get("modal-friendtechtasksinfra-farmer-param-");
		} else if (customId.startsWith("modal_coin_exec_buy_")) {
			command = client.modalCommands.get("modal_coin_exec_buy_");
		} else if (customId.startsWith("modal_coin_exec_sell_")) {
			command = client.modalCommands.get("modal_coin_exec_sell_");
		} else if (customId.startsWith("modal_coin_manager_exec_")) {
			command = client.modalCommands.get("modal_coin_manager_exec_");
		} else if (customId.startsWith("modal_coin_infra_tracker_")) {
			command = client.modalCommands.get("modal_coin_infra_tracker_");
		} else if (customId.startsWith("modal_infra_nft_walletsetup_")) {
			command = client.modalCommands.get("modal_infra_nft_walletsetup_");
		} else if (customId.startsWith("modal_nft_infra_tracker_")) {
			command = client.modalCommands.get("modal_nft_infra_tracker_");
		} else if (customId.startsWith("modal_portfolio_nft_infra_")) {
			command = client.modalCommands.get("modal_portfolio_nft_infra_");
		} 
		
		
		
		else {
			command = client.modalCommands.get(customId);
		}
		
		// If the interaction is not a command in cache, return error message.
		// You can modify the error message at ./messages/defaultModalError.js file!

		if (!command) {
			await require("../messages/defaultModalError").execute(interaction);
			return;
		}

		// A try to execute the interaction.

		try {
			await command.execute(interaction);
			return;
		} catch (err) {
			console.error(err);
			await interaction.reply({
				content: "There was an issue while understanding this modal!",
				ephemeral: true,
			});
			return;
		}
	},
};
