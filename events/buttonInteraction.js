/**
 * @file Button Interaction Handler
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.3.1
 */

const { InteractionType, ComponentType } = require("discord-api-types/v10");

module.exports = {
	name: "interactionCreate",

	/**
	 * @description Executes when an interaction is created and handle it.
	 * @author JAYZHVJ
	 * @param {import('discord.js').ButtonInteraction & { client: import('../typings').Client }} interaction The interaction which was created
	 */

	async execute(interaction) {
		// Deconstructed client from interaction object.
		const { client } = interaction;

		// Checks if the interaction is a button interaction (to prevent weird bugs)

		if (!interaction.isButton()) return;

		let customId = interaction.customId
		let command = ""

		// On redirige vers les bons fichier dans le cas d'un exec (transfert de l'info)
		if (customId.startsWith("button_friendtech_exec_buy_")) {

			command = client.buttonCommands.get("button_friendtech_exec_buy_");

		} else if (customId.startsWith("button_friendtech_exec_sell_")) {

			command = client.buttonCommands.get("button_friendtech_exec_sell_");

		} else if (customId.startsWith("button_friendtech_exec_quickbuy_")) {

			command = client.buttonCommands.get("button_friendtech_exec_quickbuy_");

		} else if (customId.startsWith("button_friendtech_exec_quicksell_")) {

			command = client.buttonCommands.get("button_friendtech_exec_quicksell_");

		} else if (customId.startsWith("button_friendtech_user_refresh_")) {

			command = client.buttonCommands.get("button_friendtech_user_refresh_");
			
		} else if (customId.startsWith("button_friendtech_trade_refresh_")) {

			command = client.buttonCommands.get("button_friendtech_trade_refresh_");
			
		} else if (customId.startsWith("button_friendtech_user_panel_")) {

			command = client.buttonCommands.get("button_friendtech_user_panel_");
			
		} else if (customId.startsWith("button_friendtech_tradeSW_copy_")) {

			command = client.buttonCommands.get("button_friendtech_tradeSW_copy_");
			
		} else if (customId.startsWith("button_friendtech_infra_security_")) {

			command = client.buttonCommands.get("button_friendtech_infra_security_");
			
		} else if (customId.startsWith("ft_interaction_")) {

			command = client.buttonCommands.get("ft_interaction_");
			
		} else if (customId.startsWith("button-friendtechtasksinfra-sniper-param-")) {

			command = client.buttonCommands.get("button-friendtechtasksinfra-sniper-param-");
			
		} else if (customId.startsWith("friendtechtasksinfra-sniperlist-button-")) {

			command = client.buttonCommands.get("friendtechtasksinfra-sniperlist-button-");
			
		} else if (customId.startsWith("button_friendtech_deposit_history_")) {

			command = client.buttonCommands.get("button_friendtech_deposit_history_");
			
		}  else if (customId.startsWith("button-friendtechtasksinfra-order-param-")) {

			command = client.buttonCommands.get("button-friendtechtasksinfra-order-param-");
			
		} else if (customId.startsWith("friendtechtasksinfra-ordersList-button-")) {

			command = client.buttonCommands.get("friendtechtasksinfra-ordersList-button-");
			
		} else if (customId.startsWith("friendtechtasksinfra-sniperautoselllist-button-")) {

			command = client.buttonCommands.get("friendtechtasksinfra-sniperautoselllist-button-");
			
		} else if (customId.startsWith("button-friendtechtasksinfra-autosell-param-")) {

			command = client.buttonCommands.get("button-friendtechtasksinfra-autosell-param-");
			
		} else if (customId.startsWith("button_friendtech_portfolio_exec_")) {

			command = client.buttonCommands.get("button_friendtech_portfolio_exec_");
			
		} else if (customId.startsWith("friendtech_portfolio_exec_confirm_")) {

			command = client.buttonCommands.get("friendtech_portfolio_exec_confirm_");
			
		}
		
		
		
		
		
		
		
		else  {
			command = client.buttonCommands.get(customId);
		}
	
		// If the interaction is not a command in cache, return error message.
		// You can modify the error message at ./messages/defaultButtonError.js file!

		if(!command) {
		await require("../messages/defaultButtonError").execute(interaction);
		return;
	}

		// A try to execute the interaction.

		try {
		await command.execute(interaction);
		return;
	} catch(err) {
		console.error(err);
		await interaction.reply({
			content: "There was an issue while executing that button!",
			ephemeral: true,
		});
		return;
	}
},
};
