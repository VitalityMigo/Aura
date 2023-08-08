/**
 * @file Sample Select-Menu interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').SelectInteractionCommand}
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

const buttonsRowResetProfile = new ActionRowBuilder()
	.addComponents(
		new ButtonBuilder()
			.setCustomId('mainPageGuide-button')
			.setLabel('main page')
			.setStyle(2),
	);






module.exports = {
	id: "selectCommandGuide",

	async execute(interaction) {


		let authorId = interaction.user.id;
		let authorName = interaction.user.username;
		let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
		let serverId = interaction.member.guild.id


		if (interaction.values[0] == "selectMainpage") {

			const guideAllEmbed = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setDescription(">>> All the commands of Rolls Chasers Analytics. You can use `/access` to check which commands you have access too. Some commands are always in private mode, others are only in public mode.")
				.setTimestamp()
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Global Commands', value: "** `/guide`** - display all the commands.\n** `/statut`** - display the bot's current statut\n** `/privacy`** - consult and modify your privacy settings\n** `/report`** - report an idea or a bug to our team\n** `/access`** - check your level of access to the bot", inline: false },
					{ name: 'Analytics Commands', value: "** `/blur`** - display blur metrics for your wallets.\n** `/cryptoprofit`** - display the profit/loss infos on a ERC20 coin accross your wallets.\n** `/coin`** - display key infos on a coin (ETH or BTC)\n** `/ens`** - display key infos about an ens name\n** `/gascalculator`** - display the gas infos for a mint\n** `/gastracker`** - display the gas metrics\n** `/data`** - display major metrics of a given collection (ETH or BTC)\n** `/derisk`** - display the derisk metrics on a given collection and wallet(s)\n** `/portfolio`** - display the key portfolio metrics across your wallets\n** `/profit`** - display the profit/loss infos across all your wallets (ETH or BTC)\n** `/rcprofit`** - display the profit/loss infos across all the community wallets\n** `/twitter`** - display the key metrics of a twitter profile\n** `/walletgenerator`** - generate an unlimited number of wallets and private key", inline: false },
					{ name: 'Community Commands', value: "** `/vouch`** - vouch for a community member.\n** `/vouchleaderboard`** - consult the vouch leaderboard\n** `/getprofile`** - consult the public profile of a community member\n** `/profile`** - access your personal dashboard", inline: false },
					{ name: 'Database Commands', value: "** `/setwallet`** - set a wallet to your portfolio.\n** `/getwallets`** - display the wallets registered in your portfolio\n** `/removewallet`** - remove a wallet from your portfolio\n** `/setalert`** - set a floor price alert\n** `/getalert`** - display the floor price alerts registered in your database\n** `/removealert`** - remove a floor price alert from your database\n** `/setwatchlist`** - set a project in your watchlist (ETH or BTC)\n** `/getwatchlist`** - display the projects currently in your watchlist\n** `/removewatchlist`** - remove a project from your watchlist", inline: false },
					{ name: 'Admin Only Commands', value: "** `/team`** - manage the bot settings for your community\n** `/vouchleaderboard (clear)`** - consult the vouch leaderboard and reset it.", inline: false },
					{ name: 'Links', value: "[gitbook](https://rolls-chasers.gitbook.io/aura) ∙ [twitter](https://twitter.com/AuraAnalytics) ∙ [discord](https://discord.gg/nMKzzfR6gx) ∙ [website](https://cdn.discordapp.com/attachments/1108757872315219968/1122318373078958130/image.png)", inline: false },

				)
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

			await interaction.update({ embeds: [guideAllEmbed] });




		} else if (interaction.values[0] == "selectAccess") {

			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/access` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/access` command allows you to know which type of access you have to the bot on this particular server. You can also see all the individual commands you can use.", inline: false },
					{ name: 'Specificity', value: "This command is based on the server, not the user, which means you can have different level of access accross all your servers that has the bot.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/access)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });






		} else if (interaction.values[0] == "selectAlerts") {

			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the various alerts command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The alerts commands are composed of `/setalerts`, to set a new floor price alerts, of /getalerts, to display your current alerts, and of /removealerts, to remove one of your alerts. Alerts are triggered when the floor price of the selected collection reaches the alert's price", inline: false },
					{ name: 'Specificity', value: "This command is user based, which means if you have set a floor price alert in a community, the alert will also be set across all the community you are part of that use the bot. However, the alert will only send a message in the channel in which you set it when it's triggered. The limit is 10 upward alerts and 10 downwards alerts.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/alerts-set)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });






		} else if (interaction.values[0] == "selectBlur") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/blur` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/blur` command allows the user to display key Blur metrics of his wallet(s. The user can choose between displaying the metrics on one of his registered wallet or across all his registered wallets.", inline: false },
					{ name: 'Specificity', value: "The wallet selection is user-based, which means that the wallets you registered using `/wallet set` or `/wallet raw` are the same accross all your server that have access to the bot.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/blur)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectCoin") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/coin` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/coin` command allows the user to display key metrics on a ERC20 (Ethereum) or BRC20 (Bitcoin) coin.", inline: false },
					{ name: 'Specificity', value: "To make sure that everything works properly, please enter the contract address of the coin for ERC20 token, and the symbol of the coin for BRC20 token.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/coin)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectCryptoprofit") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/cryptoprofit` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/cryptoprofit` command allows the user to display his profit and loss metrics on any ERC20 coin, accross one or few of his registered wallet(s).", inline: false },
					{ name: 'Specificity', value: "To make sure that everything works properly, please enter the contract address of the coin for ERC20 token.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/cryptoprofit)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectGetData") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/data` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/data` command allows the user to display key metrics about a specific Ethereum or Bitcoin collection such as the floor price, the listed token ration, the volume, the market cap and more.", inline: false },
					{ name: 'Specificity', value: "Please note that if you encounter an error using this command, it might be because few collections have the same name. You can also enter directly the contract address (for Ethereum) or the symbol (for Bitcoin).", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/data)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectGetderisk") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/derisk` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/derisk` command allows the user to display his derisk metrics on a specific Ethereum or Bitcoin collection such as the amount spent, the floor price of the collection, the average derisk price per token and more. The user can choose between analyzing one of his registered wallet or accross all his registered wallet.", inline: false },
					{ name: 'Specificity', value: "Please note that this command only takes into account the tokens you currently own, not past profits made on the same collection and wallet(s). ", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/derisk)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });


		} else if (interaction.values[0] == "selectEns") {



			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/ens` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/ens` command allows the user to display infos about an ENS such as its owner, ENS related to this one or various links related to it.", inline: false },
					{ name: 'Specificity', value: "When using this command, don't forget the .eth at the end of the ENS domain name", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/ens)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });



		} else if (interaction.values[0] == "selectGascalculator") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/gascalculator` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/gascalculator` command allows the user to calculate the estimated price of gas fees he will pay for a transaction. The command allows the user to display the result on a large range of gas fees to take in account the potential ETH network congestion.", inline: false },
					{ name: 'Specificity', value: "The data displayed by this command are only estimation, please do your due diligence to adapt them to your situation.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/gas-calculator)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		} else if (interaction.values[0] == "selectGastracker") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/gastracker` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/gastracker` command allows the user to display the current Ethereum main gas fees metrics, such as the gas price, the current block number or the average confirmation time for a transaction using the recommended amount of gas.", inline: false },
					{ name: 'Specificity', value: "The data displayed by this command are only estimation, please do your due diligence to adapt them to your situation.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/gas-tracker)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectGetprofile") {



			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/getprofile` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/getprofile` command allows the user to consult the public profile of a community member. The profile is composed of various information such as discord and twitter links, projects the member is working on and more. The profile can be set with the command `/profile`.", inline: false },
					{ name: 'Specificity', value: "This command is server-based, which means that you can only display the public profile of bot users in the community in which you are using it. For the command to work properly, make sure you start your command with an @ to find the user you want.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/profile)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		} else if (interaction.values[0] == "selectMarket") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/market` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/market` command allows the user to display the main metrics of the current Ethereum NFT market, including the global volume, number of wallets and whales, and more. The user can choose to adapt the metrics to a certain timespan.", inline: false },
					{ name: 'Specificity', value: "This command can be used by anyone, no matter their role in the community", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/market)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		} else if (interaction.values[0] == "selectPortfolio") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/portfolio` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/portfolio` command allows the user to display the main metrics of one of his registered Ethereum wallets or accross all his registered wallets. The analyze retrieve various metrics such as the wallet balance, the main ERC20/ERC721 tokens amount held and more.", inline: false },
					{ name: 'Specificity', value: "The wallet selection is user-based, which means that the wallets you registered using `/wallet set` or `/wallet raw` are the same accross all your server that have access to the bot.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/portfolio)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		} else if (interaction.values[0] == "selectPrivacy") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/privacy` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/privacy` command allows the user to switch between private and public mode in a simple click. In public mode, the result of the commands the user is executing could be seen by everyone, while the user is the only who can see them in private mode.", inline: false },
					{ name: 'Specificity', value: "The privacy mechanism is user-based, which means that your privacy setting are the same across all your server that have access to the bot. This page can also be accessed from the user dashboard using /profile.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/privacy)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectProfile") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/profile` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/profile` command allows the user to access is personal dashboard. This dashboards is the place where a user can change their profile, settings, and more.", inline: false },
					{ name: 'Specificity', value: "The profile is user based, which means if you profile in a community is the same across all the community you are part of that use the bot. Your profile is common to all your communities.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/profile)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectProfit") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/profit` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/profit` command allows the user to display his profit and loss metrics on a specific Ethereum or Bitcoin collection. The analyze retrieves metrics such as the amount spent/sold, the amount of token bought/sold/held, the realized and potential profit and loss and more. The user can choose between analyzing one of his registered wallet or accross all his registered wallet.", inline: false },
					{ name: 'Specificity', value: "Please note that if you encounter an error using this command, it might be because few collections have the same name. You can also enter directly the contract address (for Ethereum) or the symbol (for Bitcoin).", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/profit)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectRcprofit") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/rcprofit` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/rcprofit` command allows the admins of a community to display the profit and loss metrics of the group on a specific collection. The analyze retrieves metrics such as the amount spent/sold, the realized profit and loss, the number of community members involved and more. The admin can choose between analyzing one collection or all the trade activity no matter the collection.", inline: false },
					{ name: 'Specificity', value: "Please note that if you encounter an error using this command, it might be because few collections have the same name. You can also enter directly the contract address (for Ethereum) or the symbol (for Bitcoin). This command can only be used by the community's administrator.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/rcprofit)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectReport") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/report` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/report` command allows the user to submit a bug, an error, a suggestion or an idea to the team. Reports are being constantly treated by our team.", inline: false },
					{ name: 'Specificity', value: "We encourage you to submit a report for each bug, problems and ideas you have, even though you told it to the team already, it helps a lot to improve the tool.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/report)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectTeam") {


			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/team` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/team` command allows the admins of the server to modify the settings of the bot, such as the admin and member role, or the community's admin password. It has been built to let the team navigate through a quick, secured and efficient dashboard.", inline: false },
					{ name: 'Specificity', value: "This command is only available to the community's administrator and requires a password. Also, some features of this dashboard are only accessible to the communities having the required access level.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/team)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectVouch") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/vouch` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/vouch` command allows the user to vouch for a member of the community that helped him with anything. The amount of vouch for each user is then stored in the database.", inline: false },
					{ name: 'Specificity', value: "This command is community based, which means if you vote for someone, the vote is only valid in the community you voted in. You can only vouch for someone once every 24 hours, and not for yourself.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/vouch)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		} else if (interaction.values[0] == "selectVouchleaderboard") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/vouchleaderboard` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/vouchleaderboard` command allows the user to display the vouch leaderboard, which means the members that have the most vouch, that helped the most since the last reset of the leaderboard. The admins of the community have the possibility to reset the leaderboard to zero.", inline: false },
					{ name: 'Specificity', value: "This command is community based, which means if you vote for someone, the vote is only valid in the community you voted in, and the leaderboard displayed is the one for this community only", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/vouchleaderboard)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		}  else if (interaction.values[0] == "selectWallet") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the various wallets commands")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The wallets commands are composed of `/wallet set` or `/wallet raw`, to set a new Ethereum or Bitcoin wallet in your portfolio, of `/getwallet`, to display all your registered wallets, and of `/removewallet`, to remove a wallet from your portfolio.", inline: false },
					{ name: 'Specificity', value: "This command is user based, which means if you have set a wallet in a community, the wallet will also be set across all the community you are part of that use the bot. Your portfolio of wallet remains the same everywhere.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/wallet-set)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		} else if (interaction.values[0] == "selectWalletgenerator") {





			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the `/walletgenerator` command")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The `/walletgenerator` command allows the user to generate thousands of wallets in few seconds. When the wallets are generated, they're ready to use and return to the user with the public address and private key, in a ready to download csv file.", inline: false },
					{ name: 'Specificity', value: "Please note that the wallets generated with this command are encrypted using the Web3.js protocol and not stored once downloaded.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/walletgenerator)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });




		} else if (interaction.values[0] == "selectWatchlist") {




			const embedGuide = new EmbedBuilder().setColor("#060A8F")
				.setTitle("Guide")
				.setAuthor({ name: authorName, iconURL: userAvatar })
				.setDescription(">>> Guide of the various watchlist commands")
				.setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
				.addFields(
					{ name: ' ', value: " ", inline: false },
					{ name: 'Features', value: "The watchlist commands are composed of `/setwatchlist`, to set a new Ethereum or Bitcoin collection in your watchlist, of `/getwatchlist`, to display all the collections in your watchlist, and of `/removewatchlist`, to remove a collection from your watchlist.", inline: false },
					{ name: 'Specificity', value: "This command is user based, which means if you have set a project in your watchlist in a community, the project will also be set in your watchlist across all the communities you are part of that use the bot. Your watchlist remains the same everywhere.", inline: false },
					{ name: ' ', value: " ", inline: false },
					{ name: ' ', value: "*For a full presentation of the command, click [here](https://rolls-chasers.gitbook.io/aura/commands/commands/wathclist-set)*", inline: false },
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


			await interaction.update({ embeds: [embedGuide] });





		} 




		return;
	},
};

