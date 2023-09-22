/**
 * @file Sample setwallet command with slash command.
 * @author VitalityMigo
 */

// On définit des constantes qui serviront dans l'ensemble de la commande
const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");



const { profileData, accessSql, apimonitorsql, reportsql, adminsql, alertsDown, alertsUp, usersql, Op, sequelize } = require('../../../events/database');
const fs = require('fs');
const isHttps = require('../../../functions/isHttps')



//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const reservoirApiKey = process.env.reservoirApiKey

const sdk = require('api')('@reservoirprotocol/v1.0#wt5eflddacli0');
sdk.auth(reservoirApiKey);

const moment = require('moment');
const timeStamp = Date.now();
const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
const date = new Date();
const dateLisible = date.toLocaleString();
const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
const formattedDate = date1.format('Do [of] MMMM YYYY');



module.exports = {
	data: new SlashCommandBuilder()
		.setName("alerts")
		.setDescription("Add, remove or display your floor price alert(s)")
		.addSubcommand(subcommand =>
			subcommand
				.setName("set")
				.setDescription("Set a new floor price alert")
				.addStringOption((option) =>
					option
						.setName("collection")
						.setDescription("Collection name or contract address")
						.setAutocomplete(true)
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName("1stprice")
						.setDescription("1st price for the floor alert")
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName("2ndprice")
						.setDescription("2nd price for the floor alert")
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("get")
				.setDescription("Display your floor price alert(s)")
				.addStringOption((option) =>
					option
						.setName("collection")
						.setDescription("Filter by collection name or contract address")
						.setAutocomplete(true)
						.setRequired(true)
				),

		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("remove")
				.setDescription(
					"Remove one or few of your floor price alerts"

				)
				.addStringOption((option) =>
					option
						.setName("collection")
						.setDescription("Filter by collection name or contract address")
						.setAutocomplete(true)
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName("trend")
						.setDescription("Choose if you want to remove only upwards or downwards alerts")
						.addChoices(
							{ name: 'Up', value: 'Up' },
							{ name: 'Down', value: 'Down' },
						)
				)
		),





	// Début de l'éxecution de la commande
	async execute(interaction) {


		if (interaction.guildId != null) {


			//Récupérer informations de l'utilisateur de la commande
			let authorId = interaction.user.id;
			let authorName = interaction.user.username;
			let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
			let serverId = interaction.member.guild.id
			let member = interaction.member;
			let botId = interaction.applicationId

			try {

				const botAdmins = await adminsql.findOne({ where: { botId: botId } })
				const botGlobalState = botAdmins.dataValues.botState

				let communityMemberRoleId = ""
				let communityAdminRoleId = ""
				let botPowerStatut = ""
				let communityStatut = ""
				let accessTier = ""

				//Récupère info varibale sur le bot et le serveur
				const communityRolePerms = await accessSql.findOne({ where: { serverId: serverId } })
				if (communityRolePerms != null) {
					communityMemberRoleId = communityRolePerms.dataValues.memberRoleId
					communityAdminRoleId = communityRolePerms.dataValues.adminRoleId
					botPowerStatut = communityRolePerms.dataValues.actualPower
					communityStatut = communityRolePerms.dataValues.statut
					accessTier = communityRolePerms.dataValues.accessTier

				}


				//Récupère régagle de privé/ou pas de l'utilisateur
				const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

				if (authorProfile === null) { await interaction.deferReply(); } else {
					const authorPrivacyMode = authorProfile.dataValues.privacyMode

					if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
					if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
				}



				//Checkpoint
				console.log("// Step 1 : Initialization - Executed ✅")


				if (botGlobalState.toLowerCase() === "on") {

					if (communityStatut.toLowerCase() === "active" || communityStatut == "") {

						if (accessTier.toLowerCase() == "s-tier") {

							if (member.roles.cache.has(communityMemberRoleId)) {

								//Checkpoint
								console.log("// Step 2 : Authorization - Executed ✅")



								//On enregistre le user si il est pas encore dans la database
								const timeStamp1 = Date.now();
								const actualTimestamp1 = parseFloat(timeStamp1 / 1000).toFixed(0)
								const isUser = await usersql.findOne({ where: { userId: authorId, serverId: serverId } })
								if (isUser == null) { await usersql.create({ userId: authorId, userName: authorName, userAvatar: userAvatar, serverId: serverId, timestamp: actualTimestamp1 }) }


								if (interaction.options.getSubcommand() === 'set') {

									let collection = interaction.options.getString("collection").toLowerCase();
									let fp = interaction.options.getString("1stprice");
									let fp2 = interaction.options.getString("2ndprice");
									/**
									 * @type {EmbedBuilder}
									 * @description setfp command's embed
									 */
									const setfpEmbed = new EmbedBuilder().setColor("#060A8F");

									let channelId = interaction.channelId;
									let projectImage
									let collectionName
									let lowestfp
									let fpMarketplace
									let Marketplace
									let fpvalue
									let collectionBanner
									let collectionTwitter
									let collectionWebsite
									let collectionSlug




									//If collection input starts with 0x (is an eth address)
									// if (collection.startsWith("0x")) {
									//Call API to retrieve the information
									sdk.getCollectionsV5({
										id: collection,
										includeOwnerCount: 'true',
										includeSalesCount: 'true',
										accept: '*/*'
									}).then(async ({ data }) => {

										//If the collection doesnt exist
										// if (!data.collections[0]) {
										//Embed a message saying the collection doesn't exist
										//else if the collection exists
										// } else {
										//register the project informations

										projectImage = data.collections[0].image
										collectionName = data.collections[0].name
										lowestfp = data.collections[0].floorAsk.price.amount.decimal
										fpMarketplace = data.collections[0].floorAsk.sourceDomain
										collectionBanner = data.collections[0].banner
										collectionTwitter = data.collections[0].twitterUsername
										collectionWebsite = data.collections[0].externalUrl
										collectionSlug = data.collections[0].slug


										//Correct formatting for EMBED
										if (fpMarketplace === 'opensea.io') {
											Marketplace = '[<:opensea:1062318570761101352>OpenSea](https://opensea.io/collection/' + data.collections[0].slug + ')'
										}
										if (fpMarketplace === 'looksrare.org') {
											Marketplace = '[<:looksrare:1062318572786941983>LooksRare](https://looksrare.org/collections/' + collection + ')'
										}
										if (fpMarketplace === 'magically.gg' || fpMarketplace === 'rarible.com' || fpMarketplace === 'sudoswap') {
											Marketplace = '[<:ASxRCPNG:1070385409080696902> Magically](https://magically.gg/collection/' + collection + ')'
										}
										if (fpMarketplace === 'x2y2.io') {
											Marketplace = '[<:x2y2:1062318571654496317>X2Y2](https://x2y2.io/collection/' + collection + ')'
										}
										if (fpMarketplace === 'blur.io') {
											Marketplace = '[<:blur:1062318577782378516>Blur](https://blur.io/collection/' + collection + ')'

										}




										if (!data.collections[0].floorAsk.price.amount.decimal) {
											setfpEmbed.setTitle(`${collectionName}!`)
												.setDescription(
													"The request for ***" + collectionName + "*** has failed :sob:"
												);
											await interaction.editReply({
												embeds: [setfpEmbed],
												ephemeral: true
											});
										} else {
											//DEFINE IF ALERT IS FOR FLOOR UP
											//if (floorSide === 'up') {
											if (fp > data.collections[0].floorAsk.price.amount.decimal && fp2 > data.collections[0].floorAsk.price.amount.decimal) {
												////Check if the collection exists already
												//SELECT * FROM alertsup where collection = collection and authorId = authorId
												const existingAlertUp = await alertsUp.findOne({ where: { collection: collection, authorId: authorId } });
												// check if the author already have a fp for this collection
												if (existingAlertUp !== null) {



													fpvalue = "`" + parseFloat(fp).toFixed(3) + "Ξ`:chart_with_upwards_trend:\n`" + parseFloat(fp2).toFixed(3) + "`"
													if (!fp2) {
														if (!existingAlertUp.fp) {
															const updatedAlert = await alertsUp.update({
																fp: fp,
															}, { where: { collection: collection, authorId: authorId } })


															let linksFormatted = ""
															if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
															else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
															else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
															else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }




															setfpEmbed.setTitle(`${collectionName}`)
																.setAuthor({ name: authorName, iconURL: userAvatar })
																.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
																.setImage(collectionBanner)
																.addFields(
																	{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
																	{ name: 'Alerts', value: "`" + fpvalue + "Ξ`:chart_with_upwards_trend:", inline: true },
																	{ name: 'Marketplace', value: Marketplace, inline: true },
																	//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
																	{ name: "Links", value: linksFormatted, inline: false }

																)
																.setTimestamp()
																.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
															await interaction.editReply({
																embeds: [setfpEmbed],
																ephemeral: true
															});


														} else {



															const updatedAlert = await alertsUp.update({
																fp2: fp,
															}, { where: { collection: collection, authorId: authorId } })


															let linksFormatted = ""
															if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
															else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
															else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
															else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }


															setfpEmbed.setTitle(`${collectionName}`)
																.setAuthor({ name: authorName, iconURL: userAvatar })
																.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
																.setImage(collectionBanner)
																.addFields(
																	{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
																	{ name: 'Alerts', value: "`" + fpvalue + "Ξ`:chart_with_upwards_trend:", inline: true },
																	{ name: 'Marketplace', value: Marketplace, inline: true },
																	//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
																	{ name: "Links", value: linksFormatted, inline: false }

																)
																.setTimestamp()
																.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
															await interaction.editReply({
																embeds: [setfpEmbed],
																ephemeral: true
															});
														}




													} else {
														//update all fields in the table
														const updatedAlert = await alertsUp.update({
															fp: fp,
															fp2: fp2,
														}, { where: { collection: collection, authorId: authorId } })

														fpvalue = "`" + parseFloat(fp).toFixed(3) + "Ξ`:chart_with_upwards_trend:\n`" + parseFloat(fp2).toFixed(3) + "Ξ`:chart_with_upwards_trend:"


														let linksFormatted = ""
														if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
														else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
														else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
														else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }


														setfpEmbed.setTitle(`${collectionName}`)
															.setAuthor({ name: authorName, iconURL: userAvatar })
															.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
															.setImage(collectionBanner)
															.addFields(
																{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
																{ name: 'Alerts', value: fpvalue, inline: true },
																{ name: 'Marketplace', value: Marketplace, inline: true },
																//	{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
																{ name: "Links", value: linksFormatted, inline: false }
															)
															.setTimestamp()
															.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
														await interaction.editReply({
															embeds: [setfpEmbed],
															ephemeral: true
														});
													}

													//if the alertUp does not exist
												} else {
													//creates the entry in the table
													await alertsUp.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp,
														fp2: fp2,
														channelId: channelId,
													})

													fpvalue = "`" + parseFloat(fp).toFixed(3) + "Ξ`:chart_with_upwards_trend:\n `" + parseFloat(fp2).toFixed(3) + "Ξ`:chart_with_upwards_trend:"

													let linksFormatted = ""
													if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
													else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
													else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
													else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }


													setfpEmbed.setTitle(`${collectionName}`)
														.setAuthor({ name: authorName, iconURL: userAvatar })
														.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
														.setImage(collectionBanner)
														.addFields(
															{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
															{ name: 'Alerts', value: fpvalue, inline: true },
															{ name: 'Marketplace', value: Marketplace, inline: true },
															//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
															{ name: "Links", value: linksFormatted, inline: false }
														)
														.setTimestamp()
														.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
													await interaction.editReply({
														embeds: [setfpEmbed],
														ephemeral: true
													});

												}
											}
											//if (floorSide === 'down') {
											else if (fp < data.collections[0].floorAsk.price.amount.decimal && fp2 < data.collections[0].floorAsk.price.amount.decimal && fp2 !== null) {
												////Check if the collection exists already
												//SELECT * FROM alertsdown where collection = collection and authorId = authorId
												const existingAlertDown = await alertsDown.findOne({ where: { collection: collection, authorId: authorId } });
												// check if the author already have a fp for this collection
												if (existingAlertDown !== null) {

													//update all fields in the table
													const updatedAlert = await alertsDown.update({
														fp: fp,
														fp2: fp2,
													}, { where: { collection: collection, authorId: authorId } })

													fpvalue = "`" + parseFloat(fp).toFixed(3) + "Ξ`:chart_with_downwards_trend:\n `" + parseFloat(fp2).toFixed(3) + "Ξ`:chart_with_downwards_trend:"


													let linksFormatted = ""
													if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
													else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
													else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
													else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }



													setfpEmbed.setTitle(`${collectionName}`)
														.setAuthor({ name: authorName, iconURL: userAvatar })
														.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
														.setImage(collectionBanner)
														.addFields(
															{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
															{ name: 'Alerts', value: fpvalue, inline: true },
															{ name: 'Marketplace', value: Marketplace, inline: true },
															//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
															{ name: "Links", value: linksFormatted, inline: false }
														)
														.setTimestamp()
														.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
													await interaction.editReply({
														embeds: [setfpEmbed],
														ephemeral: true
													});


													//if the alertdown does not exist
												} else {
													//if no fp2 is set by the user

													//creates the entry in the table
													await alertsDown.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp,
														fp2: fp2,
														channelId: channelId,
													})

													fpvalue = "`" + parseFloat(fp).toFixed(3) + "Ξ`:chart_with_downwards_trend:\n`" + parseFloat(fp2).toFixed(3) + "Ξ`:chart_with_downwards_trend:"


													let linksFormatted = ""
													if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
													else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
													else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
													else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }



													setfpEmbed.setTitle(`${collectionName}`)
														.setAuthor({ name: authorName, iconURL: userAvatar })
														.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
														.setImage(collectionBanner)
														.addFields(
															{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
															{ name: 'Alerts', value: fpvalue, inline: true },
															{ name: 'Marketplace', value: Marketplace, inline: true },
															//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
															{ name: "Links", value: linksFormatted, inline: false }
														)
														.setTimestamp()
														.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
													await interaction.editReply({
														embeds: [setfpEmbed],
														ephemeral: true
													});

												}
											}
											//if (fp down -  fp2 up) OK
											else if (fp < data.collections[0].floorAsk.price.amount.decimal && fp2 > data.collections[0].floorAsk.price.amount.decimal) {
												////Check if the collection exists already
												//SELECT * FROM alertsup where collection = collection and authorId = authorId
												const existingAlertUp = await alertsUp.findOne({ where: { collection: collection, authorId: authorId } });
												const existingAlertDown = await alertsDown.findOne({ where: { collection: collection, authorId: authorId } });
												// check if the author already have a fp for this collection
												if (existingAlertUp && !existingAlertUp.fp) {
													//update all fields in the table
													const updatedupAlert = await alertsUp.update({
														fp: fp2,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												} else {
													const updatedupAlert = await alertsUp.update({
														fp2: fp2,
													}, { where: { collection: collection, authorId: authorId } })
												}
												if (existingAlertDown && !existingAlertDown.fp) {
													//update all fields in the table
													const updateddownAlert = await alertsDown.update({
														fp: fp,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												} else {
													//update all fields in the table
													const updateddownAlert = await alertsDown.update({
														fp2: fp,
													}, { where: { collection: collection, authorId: authorId } })
												}
												//if no fp2 is set by the user
												//creates the entry in the table
												if (!existingAlertUp) {
													await alertsUp.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp2,
														fp2: null,
														channelId: channelId,
													})
												}
												if (!existingAlertDown) {

													await alertsDown.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp,
														fp2: null,
														channelId: channelId,
													})
												}

												fpvalue = parseFloat(fp2).toFixed(3) + "Ξ`:chart_with_upwards_trend:\n`" + parseFloat(fp).toFixed(3) + "Ξ`:chart_with_downwards_trend:"

												let linksFormatted = ""
												if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
												else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }


												setfpEmbed.setTitle(`${collectionName}`)
													.setAuthor({ name: authorName, iconURL: userAvatar })
													.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
													.setImage(collectionBanner)
													.addFields(
														{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
														{ name: 'Alerts', value: "`" + fpvalue, inline: true },
														{ name: 'Marketplace', value: Marketplace, inline: true },
														//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
														{ name: "Links", value: linksFormatted, inline: false }
													)
													.setTimestamp()
													.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
												await interaction.editReply({
													embeds: [setfpEmbed],
													ephemeral: true
												});



											}
											//if fp up - fp2 down
											else if (fp > data.collections[0].floorAsk.price.amount.decimal && fp2 < data.collections[0].floorAsk.price.amount.decimal && fp2 !== null) {
												////Check if the collection exists already
												//SELECT * FROM alertsup where collection = collection and authorId = authorId
												const existingAlertUp = await alertsUp.findOne({ where: { collection: collection, authorId: authorId } });
												const existingAlertDown = await alertsDown.findOne({ where: { collection: collection, authorId: authorId } });
												// check if the author already have a fp for this collection
												if (existingAlertUp && !existingAlertUp.fp) {
													//update all fields in the table
													const updatedupAlert = await alertsUp.update({
														fp: fp,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												} else {
													const updatedupAlert = await alertsUp.update({
														fp2: fp,
													}, { where: { collection: collection, authorId: authorId } })
												}
												if (existingAlertDown && !existingAlertDown.fp) {
													//update all fields in the table
													const updateddownAlert = await alertsDown.update({
														fp: fp2,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												}
												else {
													//update all fields in the table
													const updateddownAlert = await alertsDown.update({
														fp2: fp2,
													}, { where: { collection: collection, authorId: authorId } })

												}
												//if no fp2 is set by the user
												//creates the entry in the table
												if (!existingAlertUp) {
													await alertsUp.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp,
														fp2: null,
														channelId: channelId,
													})
												}
												if (!existingAlertDown) {

													await alertsDown.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp2,
														fp2: null,
														channelId: channelId,
													})
												}

												fpvalue = parseFloat(fp).toFixed(3) + "Ξ`:chart_with_upwards_trend:\n`" + parseFloat(fp2).toFixed(3) + "Ξ`:chart_with_downwards_trend:"

												let linksFormatted = ""
												if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
												else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }


												setfpEmbed.setTitle(`${collectionName}`)
													.setAuthor({ name: authorName, iconURL: userAvatar })
													.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
													.setImage(collectionBanner)
													.addFields(
														{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
														{ name: 'Alerts', value: "`" + fpvalue, inline: true },
														{ name: 'Marketplace', value: Marketplace, inline: true },
														//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
														{ name: "Links", value: linksFormatted, inline: false }
													)
													.setTimestamp()
													.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
												await interaction.editReply({
													embeds: [setfpEmbed],
													ephemeral: true
												});



											}
											//if fp up - fp2 null
											else if (fp > data.collections[0].floorAsk.price.amount.decimal && !fp2) {
												////Check if the collection exists already
												//SELECT * FROM alertsup where collection = collection and authorId = authorId
												const existingAlertUp = await alertsUp.findOne({ where: { collection: collection, authorId: authorId } });
												// check if the author already have a fp for this collection
												if (existingAlertUp && !existingAlertUp.fp) {
													//update all fields in the table
													const updatedupAlert = await alertsUp.update({
														fp: fp,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												} else {
													//update all fields in the table
													const updatedupAlert = await alertsUp.update({
														fp2: fp,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												}
												//if no fp2 is set by the user
												//creates the entry in the table
												if (!existingAlertUp) {
													await alertsUp.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp,
														fp2: null,
														channelId: channelId,
													})
												}

												fpvalue = parseFloat(fp).toFixed(3) + "Ξ`:chart_with_upwards_trend:"

												let linksFormatted = ""
												if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
												else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }


												setfpEmbed.setTitle(`${collectionName}`)
													.setAuthor({ name: authorName, iconURL: userAvatar })
													.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
													.setImage(collectionBanner)
													.addFields(
														{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
														{ name: 'Alert', value: "`" + fpvalue, inline: true },
														{ name: 'Marketplace', value: Marketplace, inline: true },
														//{ name: 'Creation Date', value: "`" + formattedDate + "`", inline: false },
														{ name: "Links", value: linksFormatted, inline: false }
													)
													.setTimestamp()
													.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
												await interaction.editReply({
													embeds: [setfpEmbed],
													ephemeral: true
												});



											}
											//if fp down - fp2 null
											else if (fp < data.collections[0].floorAsk.price.amount.decimal && !fp2) {
												////Check if the collection exists already
												//SELECT * FROM alertsDown where collection = collection and authorId = authorId
												const existingAlertDown = await alertsDown.findOne({ where: { collection: collection, authorId: authorId } });
												// check if the author already have a fp for this collection
												if (existingAlertDown && !existingAlertDown.fp) {
													//update all fields in the table
													const updateddownAlert = await alertsDown.update({
														fp: fp,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												} else {
													//update all fields in the table
													const updateddownAlert = await alertsDown.update({
														fp2: fp,
													}, { where: { collection: collection, authorId: authorId } })
													//if the alertUp does not exist
												}
												//
												//if no fp2 is set by the user
												//creates the entry in the table
												if (!existingAlertDown) {
													await alertsDown.create({
														collection: collection,
														collectionName: collectionName,
														authorId: authorId,
														fp: fp,
														fp2: null,
														channelId: channelId,
													})
												}

												fpvalue = parseFloat(fp).toFixed(3) + "Ξ`:chart_with_downwards_trend:"
												let linksFormatted = ""
												if (isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else if (!isHttps(collectionWebsite) && collectionTwitter !== null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[twitter](https://twitter.com/' + collectionTwitter + ")" }
												else if (isHttps(collectionWebsite) && collectionTwitter == null) { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ") ∙ " + '[website](' + collectionWebsite + ")" }
												else { linksFormatted = '[opensea](https://opensea.io/collection/' + collectionSlug + ") ∙ " + '[blur](https://blur.io/collection/' + collection + ") ∙ " + '[magically](https://magically.gg/collection/' + collection + ") ∙ " + '[etherscan](https://etherscan.io/address/' + collection + ")" }



												setfpEmbed.setTitle(`${collectionName}`)
													.setAuthor({ name: authorName, iconURL: userAvatar })
													.setDescription(">>> A new alert has been set on `" + collectionName + "`.")
													.setImage(collectionBanner)
													.addFields(
														{ name: 'Floor Price', value: "`" + lowestfp + 'Ξ`', inline: true },
														{ name: 'Alert', value: "`" + fpvalue, inline: true },
														{ name: 'Marketplace', value: Marketplace, inline: true },
														{ name: "Links", value: linksFormatted, inline: false }

													)
													.setTimestamp()
													.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
												await interaction.editReply({
													embeds: [setfpEmbed],
													ephemeral: true
												});



											}
											else if (fp == data.collections[0].floorAsk.price.amount.decimal || fp2 == data.collections[0].floorAsk.price.amount.decimal) {
												setfpEmbed.setTitle(`${collectionName}`)
													.setDescription("You can't set this alert since the price is the same as the current floor price of on `" + collectionName + "`. Try to set an alert for another price.")
													.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
													.setAuthor({ name: authorName, iconURL: userAvatar })
													.setTimestamp()
													.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
												await interaction.editReply({
													embeds: [setfpEmbed],
													ephemeral: true
												});
											}



										}



										//On enregistre le call API dans la database
										const timeStamp = Date.now();
										await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/setalert", apiCallName: "getCollectionsV5", apiProvider: "reservoir", timestamp: timeStamp.toString() })



									})
									//.catch(err => console.log(err + "1erCATCH\nCollection-->" + collection + "\nFP-->" + fp));





								} else if (interaction.options.getSubcommand() === 'get') {

									const getalertEmbed = new EmbedBuilder().setColor("#060A8F");
									let projectAlertsUp = ""
									let priceAlertsUp = ""
									let projectAlertsDown = ""
									let priceAlertsDown = ""
									let fp
									let fp2
									let formatfp = ""
									let collection = interaction.options.getString("collection")
									let alertsUpEmbed = " "
									let alertsDownEmbed = " "
									let alertsUpTable = []
									let alertsDownTable = []
									let alertsUpTableCollection = []
									let alertsDownTableCollection = []
									let alertsUpEmbedCollection = ""
									let alertsDownEmbedCollection = ""
									let alertCount = 0

									//SELECT all alerts up and down
									const existingAlertUp = await alertsUp.findAll({ where: { authorId: authorId } });
									const existingAlertDown = await alertsDown.findAll({ where: { authorId: authorId } });


									let collectionAlertCount = 0;
									for (const obj of existingAlertUp) { collectionAlertCount++ }
									for (const obj of existingAlertDown) { collectionAlertCount++ }


									if (collection === 'All') {



										if (existingAlertUp.length > 0) {
											existingAlertUp.forEach((alertsup) => {
												if (alertsup.dataValues.fp != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp,
													};
													alertsUpTable.push(obj);
												}
												if (alertsup.dataValues.fp2 != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp2,
													};
													alertsUpTable.push(obj);
												}
												alertsUpTable.sort((a, b) => a.collectionName.localeCompare(b.collectionName));
											});

											for (const obj of alertsUpTable) {


												let lignMaxSize = 55
												let leftPartNfts = "`" + (obj.collectionName).toLowerCase()
												let rightPartNfts = parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												let leftPartNFTsLenght = leftPartNfts.length
												let rightPartNftsLenght = rightPartNfts.length
												let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
												let spaceLenght = ""
												for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }




												alertsUpEmbed += "`" + (obj.collectionName).toLowerCase() + spaceLenght + parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												alertCount++
											}

										} else {

											alertsUpEmbed = "`No upward alert found in your database`"

										}


										if (existingAlertDown.length > 0) {

											existingAlertDown.forEach((alertsup) => {
												if (alertsup.dataValues.fp != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp,
													};
													alertsDownTable.push(obj);
												}
												if (alertsup.dataValues.fp2 != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp2,
													};
													alertsDownTable.push(obj);
												}
												alertsDownTable.sort((a, b) => a.collectionName.localeCompare(b.collectionName));
											});

											for (const obj of alertsDownTable) {


												let lignMaxSize = 55
												let leftPartNfts = "`" + (obj.collectionName).toLowerCase()
												let rightPartNfts = parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												let leftPartNFTsLenght = leftPartNfts.length
												let rightPartNftsLenght = rightPartNfts.length
												let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
												let spaceLenght = ""
												for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }




												alertsDownEmbed += "`" + (obj.collectionName).toLowerCase() + spaceLenght + parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												alertCount++

											}

										} else {

											alertsDownEmbed = "`No downward alert found in your database`"

										}





										if (existingAlertUp == "" && existingAlertDown == "") {
											getalertEmbed.setTitle(`${interaction.user.username}\'s alerts`)
												.setDescription(
													"No alert are set in " + authorName + " database. You can use `/setalerts`to set your first floor price alert."
												).setThumbnail(userAvatar)
												.setAuthor({ name: authorName, iconURL: userAvatar })

												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
										} else {




											getalertEmbed.setTitle(`${interaction.user.username}\'s alerts`)
												.setDescription(
													">>> Displaying all the alerts of " + authorName)
												.setThumbnail(userAvatar)
												.setAuthor({ name: authorName, iconURL: userAvatar })
												.addFields(
													{ name: ' ', value: ' ', inline: false },
													{ name: 'Collection Count', value: "`" + collectionAlertCount + " collections`", inline: true },
													{ name: 'Alert Count', value: "`" + alertCount + " alerts`", inline: true },
													{ name: ' ', value: ' ', inline: false },
													{ name: 'Alerts :chart_with_upwards_trend:', value: alertsUpEmbed, inline: false },
													{ name: ' ', value: ' ', inline: false },
													{ name: 'Alerts :chart_with_downwards_trend:', value: alertsDownEmbed, inline: false }
												)
												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
										}




										await interaction.editReply({
											embeds: [getalertEmbed]
											//ephemeral: true
										});




									} else {
										const alertUpforCollection = await alertsUp.findAll({
											where: {
												collectionName: {
													[Op.like]: collection
												},

												[Op.and]: [
													{
														authorId: authorId
													}
												]

											}

										})
										const alertDownforCollection = await alertsDown.findAll({
											where: {
												collectionName: {
													[Op.like]: collection
												},

												[Op.and]: [
													{
														authorId: authorId
													}
												]

											}
										})




										if (alertUpforCollection.length > 0) {

											alertUpforCollection.forEach((alertsup) => {
												if (alertsup.dataValues.fp != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp,
													};
													alertsUpTableCollection.push(obj);
												}
												if (alertsup.dataValues.fp2 != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp2,
													};
													alertsUpTableCollection.push(obj);
												}
												alertsUpTableCollection.sort((a, b) => a.collectionName.localeCompare(b.collectionName));
											});

											for (const obj of alertsUpTableCollection) {


												let lignMaxSize = 55
												let leftPartNfts = "`" + (obj.collectionName).toLowerCase()
												let rightPartNfts = parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												let leftPartNFTsLenght = leftPartNfts.length
												let rightPartNftsLenght = rightPartNfts.length
												let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
												let spaceLenght = ""
												for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


												alertsUpEmbedCollection += "`" + (obj.collectionName).toLowerCase() + spaceLenght + parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												alertCount++
											}

										} else {

											alertsUpEmbedCollection = "`No upward alert found for " + collection.toLowerCase() + "`"

										}


										if (alertDownforCollection.length > 0) {

											alertDownforCollection.forEach((alertsup) => {
												if (alertsup.dataValues.fp != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp,
													};
													alertsDownTableCollection.push(obj);
												}
												if (alertsup.dataValues.fp2 != null) {
													const obj = {
														collectionName: alertsup.dataValues.collectionName,
														collection: alertsup.dataValues.collection,
														value: alertsup.dataValues.fp2,
													};
													alertsDownTableCollection.push(obj);
												}
												alertsDownTableCollection.sort((a, b) => a.collectionName.localeCompare(b.collectionName));
											});

											for (const obj of alertsDownTableCollection) {


												let lignMaxSize = 55
												let leftPartNfts = "`" + (obj.collectionName).toLowerCase()
												let rightPartNfts = parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												let leftPartNFTsLenght = leftPartNfts.length
												let rightPartNftsLenght = rightPartNfts.length
												let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
												let spaceLenght = ""
												for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }




												alertsDownEmbedCollection += "`" + (obj.collectionName).toLowerCase() + spaceLenght + parseFloat(obj.value).toFixed(3) + "Ξ`\n"
												alertCount++
											}


										} else {


											alertsDownEmbedCollection = "`No downward alerts alert found for " + collection.toLowerCase() + "`"

										}




										getalertEmbed.setTitle(`${interaction.user.username}\'s alerts`)
											.setDescription(
												">>> Displaying the alerts of " + authorName + " on **" + collection + "**"
											).setThumbnail(userAvatar)
											.setAuthor({ name: authorName, iconURL: userAvatar })
											.addFields(
												{ name: ' ', value: ' ', inline: false },
												{ name: 'Collection Count', value: "`" + collectionAlertCount + " collections`", inline: true },
												{ name: 'Alert Count', value: "`" + alertCount + " alerts`", inline: true },
												{ name: ' ', value: ' ', inline: false },
												{ name: 'Alerts :chart_with_upwards_trend:', value: alertsUpEmbedCollection, inline: false },
												{ name: ' ', value: ' ', inline: false },
												{ name: 'Alerts :chart_with_downwards_trend:', value: alertsDownEmbedCollection, inline: false }
											)
											.setTimestamp()
											.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })




										await interaction.editReply({
											embeds: [getalertEmbed],
											//ephemeral: true
										});




									}



								} else if (interaction.options.getSubcommand() === 'remove') {

									let collection = interaction.options.getString("collection")
									let floorSide = interaction.options.getString("trend")
									let authorName = interaction.user.username;

									const removealertEmbed = new EmbedBuilder().setColor("#060A8F")

									//console.log(collection)
									let userAvatar = "https://cdn.discordapp.com/avatars/" + authorId + "/" + interaction.user.avatar + ".png"

									//let projectUrl = 'https://magically.gg/collection/' + collection
									if (collection === 'All') {
										if (floorSide === 'Up') {
											const datauptoRemove = await alertsUp.destroy({ where: { authorId: authorId } });

											removealertEmbed.setTitle(`${interaction.user.username}'s alerts`)
												.setThumbnail(userAvatar)
												.setAuthor({ name: authorName, iconURL: userAvatar })
												.setDescription(
													"All the upwards trend alerts of " + authorName + " have been removed from the database.")
												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

											// await interaction.reply({
											// 	embeds: [removealertEmbed],
											// 	//ephemeral: true
											// });
										} else if (floorSide === 'Down') {
											//const datauptoRemove = await alertsUp.destroy({ where: { authorId: authorId } });
											const datadowntoRemove = await alertsDown.destroy({ where: { authorId: authorId } });
											removealertEmbed.setTitle(`${interaction.user.username}'s alerts`)
												.setAuthor({ name: authorName, iconURL: userAvatar })
												.setThumbnail(userAvatar)
												.setDescription(
													"All the downwards trend alerts of " + authorName + " have been removed from the database.")
												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

											// await interaction.reply({
											// 	embeds: [removealertEmbed],
											// 	//ephemeral: true
											// });
										} else {
											const datauptoRemove = await alertsUp.destroy({ where: { authorId: authorId } });
											const datadowntoRemove = await alertsDown.destroy({ where: { authorId: authorId } });
											removealertEmbed.setTitle(`${interaction.user.username}'s alerts`)
												.setAuthor({ name: authorName, iconURL: userAvatar })
												.setThumbnail(userAvatar)
												.setDescription(
													"All the floor price alerts of " + authorName + " have been removed from the database.")
												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })
										}
										await interaction.editReply({
											embeds: [removealertEmbed],
											//ephemeral: true
										});
									} else {
										if (floorSide === 'Up') {
											// if (!datauptoRemove) return interaction.reply('Alert not found for ' + collection)
											const datauptoRemove = await alertsUp.destroy({ where: { collectionName: collection, authorId: authorId } });
											removealertEmbed.setTitle(`${interaction.user.username}'s alerts`)
												.setAuthor({ name: authorName, iconURL: userAvatar })
												.setThumbnail(userAvatar)
												.setDescription("All the upwards trend alerts of " + authorName + " on `" + collection + "` have been removed from the database.")
												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

											await interaction.editReply({
												embeds: [removealertEmbed],
												//ephemeral: true
											});
										}
										else if (floorSide === 'Down') {
											// if (!datauptoRemove) return interaction.reply('There is no alert for this project')
											const datauptoRemove = await alertsDown.destroy({ where: { collectionName: collection, authorId: authorId } });
											removealertEmbed.setTitle(`${interaction.user.username}'s alerts`)
												.setAuthor({ name: authorName, iconURL: userAvatar })
												.setThumbnail(userAvatar)
												.setDescription(
													"All the downwards trend alerts of " + authorName + " on `" + collection + "` have been removed from the database.")
												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

											await interaction.editReply({
												embeds: [removealertEmbed],
												//ephemeral: true
											});
										} else {
											const datauptoRemove = await alertsUp.destroy({ where: { authorId: authorId, collectionName: collection } });
											const datadowntoRemove = await alertsDown.destroy({ where: { authorId: authorId, collectionName: collection } });
											removealertEmbed.setTitle(`${interaction.user.username}'s alerts`)
												.setAuthor({ name: authorName, iconURL: userAvatar })
												.setThumbnail(userAvatar)
												.setDescription(
													"All the floor price alerts of " + authorName + " on `" + collection + "` have been removed from the database.")
												.setTimestamp()
												.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

											await interaction.editReply({
												embeds: [removealertEmbed],
												//ephemeral: true
											});
										}

									}



								}


							} else if (!member.roles.cache.has(communityMemberRoleId)) {





								const notMember = new EmbedBuilder().setColor("#060A8F")
									.setTitle(`Bot Access`)
									.setDescription(">>> Showing access data")
									.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
									.setAuthor({ name: authorName, iconURL: userAvatar })
									.addFields(
										{ name: " ", value: " ", inline: false },
										{ name: "Status", value: "`Access Denied ❌`", inline: true },
										{ name: "Required Role", value: "<@&" + communityMemberRoleId + ">", inline: true },
										{ name: "Problem Detected", value: "Your access to the bot has been denied. You can only use the bot if you have the required role in this community. If you usually have access to the bot, make sure you're in the right community or contact an admin.", inline: false },
									)
									.setTimestamp()
									.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

								await interaction.editReply({ embeds: [notMember] });

							}

						} else {

							if (accessTier == "") {
								accessTier = "Free Tier"

							}

							const botOff = new EmbedBuilder().setColor("#060A8F")
								.setTitle(`Bot Access`)
								.setDescription(">>> Showing the community's bot access")
								.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
								.setAuthor({ name: authorName, iconURL: userAvatar })
								.addFields(
									{ name: 'Access Status', value: "`Denied 🔴`", inline: false },
									{ name: 'Access Tier', value: "`" + accessTier.toUpperCase() + "`", inline: true },
									{ name: 'Required Tier', value: "`S-TIER`", inline: true },
									{ name: "Problem Detected", value: "Your access to this command has been denied. You need a higher access tier to use this feature. You can consult the available commands in this community by using `/access`.", inline: false },
								)
								.setTimestamp()
								.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

							await interaction.editReply({ embeds: [botOff] });



						}

					} else {


						const botOff = new EmbedBuilder().setColor("#060A8F")
							.setTitle(`Bot Access`)
							.setDescription(">>> Showing the community's bot access")
							.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
							.setAuthor({ name: authorName, iconURL: userAvatar })
							.addFields(
								{ name: 'Access Status', value: "`Denied 🔴`", inline: true },
								{ name: 'Commands', value: "`Not available`", inline: true },
								{ name: "Problem Detected", value: "The bot access is currently inactive in this community. The community's administrator are the only one who can make it active or not, contact them for any inquiries.", inline: false },
							)
							.setTimestamp()
							.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

						await interaction.editReply({ embeds: [botOff] });



					}


				} else {


					console.log("// Step 2 : Unauthorized - Executed ✅")


					const botOff = new EmbedBuilder().setColor("#060A8F")
						.setTitle(`Bot status`)
						.setDescription(">>> Showing the bot status")
						.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
						.setAuthor({ name: authorName, iconURL: userAvatar })
						.addFields(
							{ name: 'Global Status', value: "`Inactive 🔴`", inline: true },
							{ name: 'Commands', value: "`Not available`", inline: true },
							{ name: "Problem Detected", value: "The bot is currently inactive in this community. The community's administrator are the only who are able to switch the bot on, contact them for any inquiries.", inline: false },
						)
						.setTimestamp()
						.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

					await interaction.editReply({ embeds: [botOff] });

					console.log("// Step 3 : Answer - Executed ✅")


				}

			} catch (error) {


				console.log("// Error - sent in report ❌")

				//On envoi une notif
				let botId = interaction.applicationId
				const botAdmins = await adminsql.findOne({ where: { botId: botId } })
				const mainServerId = botAdmins.dataValues.mainServerId
				const logChannelId = botAdmins.dataValues.logChannelId
				const guild = interaction.client.guilds.cache.get(mainServerId);
				const channel = guild.channels.cache.get(logChannelId);


				const adminAccessInfos = await accessSql.findOne({ where: { serverId: serverId } })
				let adminRoleId = adminAccessInfos.dataValues.adminRoleId
				let serverName = adminAccessInfos.dataValues.serverName
				const userRoleList = interaction.member._roles
				let userHighestRole = "Member"
				if (userRoleList.includes(adminRoleId)) { userHighestRole = "Team" }
				let reportCommand = "/alerts"

				const timeStamp = Date.now();
				const date = new Date(timeStamp);
				const dateLisible = date.toLocaleString();
				const date1 = moment(dateLisible, 'M/D/YYYY, h:mm:ss A');
				const formattedDate = date1.format('Do [of] MMMM YYYY');



				//On enregistre le call
				await reportsql.create({
					botId: botId,
					authorId: "Bot",
					serverName: serverName,
					authorRole: userHighestRole,
					serverId: serverId,
					date: formattedDate,
					reportType: "Bug",
					reportCommand: reportCommand,
					reportDescription: "```" + error.stack + "```",
					reportPriority: "5",
					reportState: "Not treated",
				})



				console.log("//////////\n\nDetails de l'erreur :\n\n" + error.stack + "\n\n//////////")

				const reduceText = require("../../../functions/reducetext")
				const roleTag = "1121510423687090186"


				const updateEmbed = new EmbedBuilder().setColor("#060A8F")
					.setTitle("New Report")
					.setDescription(">>> A new report has just been sent.")
					.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
					.setAuthor({ name: "Aura", iconURL: "https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png" })
					.setTimestamp()
					.addFields(
						{ name: " ", value: " ", inline: false },
						{ name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },
						{ name: " ", value: " ", inline: false },
						{ name: "Error:", value: "```" + reduceText(error.stack, 1024) + "```", inline: false },
					)
					.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


				await channel.send("<@&" + roleTag + ">");

				await channel.send({ embeds: [updateEmbed] });


				const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
					.setTitle("An error occured")
					.setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
					.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
					.setTimestamp()
					.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png' })


				await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


			}

		} else if (interaction.guildId == null) {

			const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Aura")
				.setDescription(`Hey ${interaction.user.username}, we hope you're doing well !\n\nAlthough this may be possible in the future, Aura cannot be used in DM at the moment. If you want to have access to the bot, go here: <#1108757700885622784>.\n\nIf you have any questions, don't hesitate to contact one of our team member, or directly on Discord here : <#1121110417368956958>.\n\nHave a nice day 👑`)
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });



		}

	}
};

