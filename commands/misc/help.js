/**
 * @file Dynamic help command
 * @author JAYZHVJ
 * @since 1.0.0
 * @version 3.3.0
 */

// Deconstructing prefix from config file to use in help command
//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const prefix = process.env.bot_prefix

// Deconstructing EmbedBuilder to create embeds within this command
const { EmbedBuilder, ChannelType } = require("discord.js");

/**
 * @type {import('../../typings').LegacyCommand}
 */
module.exports = {
	name: "help",
	description: "List all commands of bot or info about a specific command.",
	aliases: ["commands"],
	usage: "[command name]",
	cooldown: 5,

	execute(message, args) {
		const { commands } = message.client;

		// If there are no args, it means it needs whole help command.

		if (!args.length) {
			/**
			 * @type {EmbedBuilder}
			 * @description Help command embed object
			 */

			let helpEmbed = new EmbedBuilder()
				.setColor("#060A8F")
				.setTitle("Get Help")
				.setDescription(
					"Hey. You can use `/guild` to display the list of all Aura's commands. Please feel free to contact our team if you encounter any issue"
				)


			// Attempts to send embed in DMs.

			return message.author
				.send({ embeds: [helpEmbed] })

				.then(() => {
					if (message.channel.type === ChannelType.DM) return;

					// On validation, reply back.

					message.reply({
						content: "I've sent you a DM!",
					});
				})
				.catch((error) => {
					// On failing, throw error.

					console.error(
						`Could not send help DM to ${message.author.tag}.\n`,
						error
					);

					message.reply({ content: "It seems like I can't DM you!" });
				});
		}

		// If argument is provided, check if it's a command.

		/**
		 * @type {String}
		 * @description First argument in lower case
		 */

		const name = args[0].toLowerCase();

		const command =
			commands.get(name) ||
			commands.find((c) => c.aliases && c.aliases.includes(name));

		// If it's an invalid command.

		if (!command) {
			return message.reply({ content: "That's not a valid command!" });
		}

		/**
		 * @type {EmbedBuilder}
		 * @description Embed of Help command for a specific command.
		 */

		let commandEmbed = new EmbedBuilder()
			.setColor("Random")
			.setTitle("Command Help");

		if (command.description)
			commandEmbed.setDescription(`${command.description}`);

		if (command.aliases)
			commandEmbed.addFields([
				{
					name: "Aliases",
					value: `\`${command.aliases.join(", ")}\``,
					inline: true,
				},
				{
					name: "Cooldown",
					value: `${command.cooldown || 3} second(s)`,
					inline: true,
				},
			]);
		if (command.usage)
			commandEmbed.addFields([
				{
					name: "Usage",
					value: `\`${prefix}${command.name} ${command.usage}\``,
					inline: true,
				},
			]);

		// Finally send the embed.

		message.channel.send({ embeds: [commandEmbed] });
	},
};
