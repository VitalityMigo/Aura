/**
 * @file Sample modal interaction
 * @author JAYZHVJ
 * @since 3.2.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ModalInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { profileData, accessSql, adminsql, reportsql, sequelize } = require('../../../events/database');
const moment = require('moment');


const buttonsRowSetProfile = new ActionRowBuilder()
	.addComponents(
		new ButtonBuilder()
			.setCustomId('userMenu-button')
			.setLabel('menu')
			.setStyle(2),


	);

module.exports = {
	id: "setProfileModal",

	async execute(interaction) {


		//Récupérer informations de l'utilisateur de la commande
		let authorId = interaction.user.id;
		let authorName = interaction.user.username;
		let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png`;
        let botId = interaction.applicationId

		try {

			//Checkpoint
			console.log("// Step 1 : Initialization - Executed ✅")
			//Checkpoint
			console.log("// Step 2 : Authorization - Executed ✅")



			//Récupérer informations de l'utilisateur de la commande
			let auhorDiscord = `https://discord.com/users/${authorId}`
			let joinedTimestamp = (interaction.member.joinedTimestamp).toString()
			let projectsListFormatted = ""

			const twitter = interaction.fields.getTextInputValue('twitter');
			const web3 = interaction.fields.getTextInputValue('web3');
			const web2 = interaction.fields.getTextInputValue('web2');
			const jobs = interaction.fields.getTextInputValue('jobs');
			const nature = interaction.fields.getTextInputValue('speciality');

			const privacyBigDataAuthor = await profileData.findOne({ where: { authorId: authorId } })

			let privacyMode = ""
			let visualSelect = ""
			if (privacyBigDataAuthor !== null) {
				privacyMode = privacyBigDataAuthor.dataValues.privacyMode
				visualSelect = privacyBigDataAuthor.dataValues.visualSelect


				await profileData.destroy({ where: { authorId: authorId } })



				await profileData.create({
					authorId: authorId,
					authorAvatar: userAvatar,
					authorName: authorName,
					authorTwitter: twitter,
					authorDiscord: auhorDiscord,
					authorWeb2: web2,
					authorWeb3: web3,
					authorJobs: jobs,
					authorNature: nature,
					authorJoined: joinedTimestamp,
					privacyMode: privacyMode,
					visualSelect: visualSelect,
				})

			} else if (privacyBigDataAuthor === null) {

				await profileData.destroy({ where: { authorId: authorId } })

				await profileData.create({
					authorId: authorId,
					authorAvatar: userAvatar,
					authorName: authorName,
					authorTwitter: twitter,
					authorDiscord: auhorDiscord,
					authorWeb2: web2,
					authorWeb3: web3,
					authorJobs: jobs,
					authorNature: nature,
					authorJoined: joinedTimestamp,
					privacyMode: "public",
					visualSelect: "1"
				})

			}
			const baseStringTwitterHandle = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";
			const appropriateForm = new RegExp(`[^${baseStringTwitterHandle}]`, "g");
			const cleanTwitterHandle = twitter.replace(appropriateForm, "");
			console.log(cleanTwitterHandle);


			const separators = /[,/:;-]/;
			const projects = jobs.split(separators);




			for (const project of projects) {

				let projectFormatted = ""
				projectFormatted = project.trim().replace(/\s+/g, " ");

				let lignMaxSize = 40
				let leftPartNfts = projectFormatted
				let rightPartNfts = "Team Member\n"
				let leftPartNFTsLenght = leftPartNfts.length
				let rightPartNftsLenght = rightPartNfts.length
				let spaceSize = lignMaxSize - (leftPartNFTsLenght + rightPartNftsLenght)
				let spaceLenght = ""
				for (let i = 0; i < spaceSize; i++) { spaceLenght += " " }


				projectsListFormatted += "`" + projectFormatted + spaceLenght + "Team`\n"


			}


			const setProfileRender = new EmbedBuilder().setColor("#060A8F")
				.setTitle(authorName + "'s Dashboard")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(`>>> Your profile have been successfully set and is now public to all the community members`)
				.setThumbnail(userAvatar)
				.addFields(
					{ name: 'Name', value: "`" + authorName + "`", inline: true },
					{ name: 'Discord ID', value: "`" + authorId + "`", inline: true },
					{ name: 'Speciality', value: "`" + nature + "`", inline: false },
					{ name: 'Web2', value: web2, inline: false },
					{ name: 'Web3', value: web3, inline: false },
					{ name: 'Projects', value: projectsListFormatted, inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: '<:RCtwitter:1096014822837080174> [Twitter](https://twitter.com/' + twitter + ")", inline: true },
					{ name: ' ', value: '<:RCdiscord:1096014711407001651> [Discord](' + auhorDiscord + ")", inline: true },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

			// Send the embed as a response to the interaction
			await interaction.update({ embeds: [setProfileRender], components: [buttonsRowSetProfile] });



			return;

		} catch (error) {



            console.log("// Error - sent in report ❌")

			//On envoi une notif
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
			let reportCommand = "/profileset"

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


			const updateEmbed = new EmbedBuilder().setColor("#060A8F")
				.setTitle("New Report")
				.setDescription(">>> A new report has just been sent.")
				.setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
				.setAuthor({ name: "Rolls Chasers Analytics", iconURL: "https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg" })
				.setTimestamp()
				.addFields(
					{ name: " ", value: " ", inline: false },
					{ name: "Content:", value: "A new `bug` has been submitted for the `" + reportCommand + "` command by `the bot report division` in `" + serverName + "`. You can use the administrator dashboard to consult it.", inline: false },

				)
				                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await channel.send({ embeds: [updateEmbed] });


			const errorAnswerUser = new EmbedBuilder().setColor("#060A8F")
				.setTitle("An error occured")
				.setDescription("An error has occurred while executing this command. These errors can occur for a variety of reasons, such as :\n∙ Unexpected traffic\n∙ API maintenance\n∙ Occasional bug\n\nPlease note that a report has already been sent to our team, who will fix the problem as soon as possible. You can still use `/report` to give more details about the error and help our team.")
				.setThumbnail('https://media.discordapp.net/attachments/949300412874362983/1040242440696758282/Logo_Rolls_V2_5.3_auto_x2.jpg')
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.reply({ embeds: [errorAnswerUser], ephemeral: true });


		}
	},
};
