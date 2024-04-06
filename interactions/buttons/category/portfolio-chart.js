
/**
 * @file Sample button interaction
 * @author JAYZHVJ
 * @since 3.0.0
 * @version 3.2.2
 */

/**
 * @type {import('../../../typings').ButtonInteractionCommand}
 */


const { ButtonInteraction } = require('discord.js');
const { EmbedBuilder } = require("discord.js");
const { accessSql, profileData, interactionData, wallets, apimonitorsql, reportsql, adminsql, sequelize } = require('../../../events/database');
const moment = require('moment');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const etherscanApiKey = process.env.etherscanApiKey

const { web3CloudflarePublic } = require("../../../config/web3config")


const axios = require('axios')
const fs = require('fs');
const Chart = require('chart.js');
const { createCanvas, loadImage } = require('canvas');
const generateRandomString = require('../../../functions/randomkey');


module.exports = {
    id: 'chartgenerator-button',

    async execute(interaction) {
        if (!(interaction instanceof ButtonInteraction)) return;

        //Récupérer informations de l'utilisateur de la commande
        let authorId = interaction.user.id;
        let authorName = interaction.user.username;
        let userAvatar = `https://cdn.discordapp.com/avatars/${authorId}/${interaction.user.avatar}.png?size=4096`;
        let serverId = interaction.member.guild.id


        try {

            //Checkpoint
            console.log("// Step 1 : Initialization - Executed ✅")



            if (interaction.message.interaction.user.id === authorId) {


                //Checkpoint
                console.log("// Step 2 : Authorization - Executed ✅")


                //Récupère régagle de privé/ou pas de l'utilisateur
                const authorProfile = await profileData.findOne({ where: { authorId: authorId } })

                if (authorProfile === null) { await interaction.deferReply(); } else {
                    const authorPrivacyMode = authorProfile.dataValues.privacyMode

                    if (authorPrivacyMode.toLowerCase() === "private") { await interaction.deferReply({ ephemeral: true }); }
                    if (authorPrivacyMode.toLowerCase() === "public") { await interaction.deferReply(); }
                }




                const lastInteractionData = await interactionData.findOne({ where: { authorId: authorId, commandName: "portfolio", serverId: serverId } })

                let userLogo = lastInteractionData.dataValues.userAvatar
                let userName = lastInteractionData.dataValues.authorName
                let selectedWallet = lastInteractionData.dataValues.walletAddress

                let valueFullTable = []
                let ethValue = []
                let dateFormatted = []
                let scaleLeftValues = []
                let roundCount = 0


                if (serverId === "949291624389816331") {



                    if (selectedWallet !== "All") {

                        // Récupérer l'historique des prix sur 6 mois et définir le wallet
                        const timeStamp = Date.now();
                        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)

                        const timestamp0week = actualTimestamp
                        const timestamp1week = actualTimestamp - (604800 * 0.5)
                        const timestamp2week = actualTimestamp - (604800 * 1)
                        const timestamp3week = actualTimestamp - (604800 * 1.5)
                        const timestamp4week = actualTimestamp - (604800 * 2)
                        const timestamp5week = actualTimestamp - (604800 * 2.5)
                        const timestamp6week = actualTimestamp - (604800 * 3)
                        const timestamp7week = actualTimestamp - (604800 * 3.5)
                        const timestamp8week = actualTimestamp - (604800 * 4)
                        const timestamp9week = actualTimestamp - (604800 * 4.5)
                        const timestamp10week = actualTimestamp - (604800 * 5)
                        const timestamp11week = actualTimestamp - (604800 * 5.5)
                        const timestamp12week = actualTimestamp - (604800 * 6)
                        const timestamp13week = actualTimestamp - (604800 * 6.5)
                        const timestamp14week = actualTimestamp - (604800 * 7)
                        const timestamp15week = actualTimestamp - (604800 * 7.5)
                        const timestamp16week = actualTimestamp - (604800 * 8)
                        const timestamp17week = actualTimestamp - (604800 * 8.5)
                        const timestamp18week = actualTimestamp - (604800 * 9)
                        const timestamp19week = actualTimestamp - (604800 * 9.5)
                        const timestamp20week = actualTimestamp - (604800 * 10)
                        const timestamp21week = actualTimestamp - (604800 * 10.5)
                        const timestamp22week = actualTimestamp - (604800 * 11)
                        const timestamp23week = actualTimestamp - (604800 * 11.5)

                        let timestampTable = [timestamp23week, timestamp22week, timestamp21week, timestamp20week, timestamp19week, timestamp18week, timestamp17week, timestamp16week, timestamp15week, timestamp14week, timestamp13week, timestamp12week, timestamp11week, timestamp10week, timestamp9week, timestamp8week, timestamp7week, timestamp6week, timestamp5week, timestamp4week, timestamp3week, timestamp2week, timestamp1week, timestamp0week]


                        //Boucle pour crée les tableaux
                        for (const timestamp of timestampTable) {

                            roundCount++


                            let obj = {}

                            const date = new Date(timestamp * 1000);
                            const month = date.getMonth() + 1;
                            const day = date.getDate();
                            const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;


                            const getBlock = await axios.get('https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=' + timestamp + '&closest=before&apikey=' + etherscanApiKey)
                            const eth = await web3CloudflarePublic.eth.getBalance(selectedWallet, getBlock.data.result);
                            const ethValueSpecific = eth / (10 ** 18)



                            obj.position = roundCount
                            obj.timestamp = timestamp
                            obj.dateFormatted = formattedDate
                            obj.ethValue = ethValueSpecific


                            valueFullTable.push(obj)
                            ethValue.push(ethValueSpecific)
                            dateFormatted.push(formattedDate)
                        }


                        const canvas = createCanvas(1500, 900);
                        const ctx = canvas.getContext('2d');



                        // Initialisez un nouveau graphique Chart.js
                        const chart = {
                            type: 'line',
                            data: {
                                labels: dateFormatted, // labels pour les nombres de 1 à 12
                                datasets: [
                                    {
                                        data: ethValue, // Données à afficher sur le graphique
                                        fill: true,
                                        borderColor: '#ffffff', // Couleur de la ligne d'évolution
                                        borderWidth: 3.5,
                                        tension: 0.4,
                                        pointRadius: 0, // Définir la taille des points
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    },
                                ],
                            },
                            options: {
                                layout: {
                                    padding: {
                                        top: 85
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false, // Désactiver le label
                                    },

                                },
                                scales: {
                                    x: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            color: '#ffffff',
                                            // This more specific font property overrides the global property
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 550,
                                            }
                                        },
                                    },
                                    y: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            beginAtZero: true,
                                            // min: 8,
                                            // max: 10,
                                            // stepSize: 2,
                                            color: '#ffffff',
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 500,

                                            }
                                        },

                                    },
                                },

                            },
                        }

                        const myChart = new Chart(ctx, chart);


                        const randomString = generateRandomString(10);


                        // Enregistrez l'image générée sur le disque (optionnel)
                        const buffer1 = canvas.toBuffer('image/png');
                        fs.writeFileSync("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "generatedchart.png", buffer1);


                        const image1 = await loadImage("./visual/rollschasers/permanent/portfoliotemplate.png");
                        const image2 = await loadImage("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "generatedchart.png");

                        const canvasFormatted = createCanvas(1500, 900);
                        const ctxFormatted = canvas.getContext('2d');

                        ctxFormatted.drawImage(image1, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                        ctxFormatted.drawImage(image2, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



                        //NOM USER
                        ctxFormatted.font = "bold 25px SFTransrobotic";
                        ctxFormatted.fillStyle = "#ffffff";
                        const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
                        ctxFormatted.fillText(authorName.toString(), (1470 - userNameSize), 856);



                        // Charger l'image de profil
                        const profileImage = await loadImage(userLogo);
                        // Position de l'image
                        const imagesize = 41;
                        const imagex = 1470 - userNameSize - imagesize - 10;
                        const imagey = 827;


                        ctxFormatted.beginPath();
                        ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                        ctxFormatted.closePath();
                        ctxFormatted.clip();
                        ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);







                        //Nombre de wallets
                        ctxFormatted.font = "bold 14px Rockwell";
                        ctxFormatted.fillStyle = "#ffffff";
                        const textWidth2 = ctxFormatted.measureText("(1 wallet)").width;
                        ctxFormatted.fillText("(1 wallet)", (750 - textWidth2 / 2), 96);







                        const buffer2 = canvas.toBuffer('image/png');



                        await interaction.editReply({

                            files: [buffer2],
                        });



                        // Supprime le fichier
                         fs.unlinkSync("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "generatedchart.png");



                        //On stock les call API
                        for (let i = 0; i < timestampTable.length; i++) {
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBlock", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                        }



                    } else if (selectedWallet === "All") {

                        //On définit la plage de wallet
                        let allWalletAddressOfAuthorTable = []
                        const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });
                        for (let i = 0; i < allWalletsOfAuthor.length; i++) { allWalletAddressOfAuthorTable.push(allWalletsOfAuthor[i].dataValues.walletAddress); }

                        let walletCount = allWalletAddressOfAuthorTable.length



                        // Récupérer l'historique des prix sur 6 mois et définir le wallet
                        const timeStamp = Date.now();
                        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)

                        const timestamp0week = actualTimestamp
                        const timestamp2week = actualTimestamp - (604800 * 1)
                        const timestamp4week = actualTimestamp - (604800 * 2)
                        const timestamp6week = actualTimestamp - (604800 * 3)
                        const timestamp8week = actualTimestamp - (604800 * 4)
                        const timestamp10week = actualTimestamp - (604800 * 5)
                        const timestamp12week = actualTimestamp - (604800 * 6)
                        const timestamp14week = actualTimestamp - (604800 * 7)
                        const timestamp16week = actualTimestamp - (604800 * 8)
                        const timestamp18week = actualTimestamp - (604800 * 9)
                        const timestamp20week = actualTimestamp - (604800 * 10)
                        const timestamp22week = actualTimestamp - (604800 * 11)

                        let timestampTable = [timestamp22week, timestamp20week, timestamp18week, timestamp16week, timestamp14week, timestamp12week, timestamp10week, timestamp8week, timestamp6week, timestamp4week, timestamp2week, timestamp0week]


                        //Boucle pour crée les tableaux
                        for (const timestamp of timestampTable) {

                            let ethValueSpecific = 0

                            for (const selectedWallet of allWalletAddressOfAuthorTable) {

                                const getBlock = await axios.get('https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=' + timestamp + '&closest=before&apikey=' + etherscanApiKey)
                                const eth = await web3CloudflarePublic.eth.getBalance(selectedWallet, getBlock.data.result);
                                ethValueSpecific += eth / (10 ** 18)

                            }
                            roundCount++



                            let obj = {}

                            const date = new Date(timestamp * 1000);
                            const month = date.getMonth() + 1;
                            const day = date.getDate();
                            const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;




                            obj.position = roundCount
                            obj.timestamp = timestamp
                            obj.dateFormatted = formattedDate
                            obj.ethValue = ethValueSpecific


                            valueFullTable.push(obj)
                            ethValue.push(ethValueSpecific)
                            dateFormatted.push(formattedDate)
                        }




                        const canvas = createCanvas(1500, 900);
                        const ctx = canvas.getContext('2d');



                        // Initialisez un nouveau graphique Chart.js
                        const chart = {
                            type: 'line',
                            data: {
                                labels: dateFormatted, // labels pour les nombres de 1 à 12
                                datasets: [
                                    {
                                        data: ethValue, // Données à afficher sur le graphique
                                        fill: true,
                                        borderColor: '#ffffff', // Couleur de la ligne d'évolution
                                        borderWidth: 3.5,
                                        tension: 0.4,
                                        pointRadius: 0, // Définir la taille des points
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    },
                                ],
                            },
                            options: {
                                layout: {
                                    padding: {
                                        top: 85
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false, // Désactiver le label
                                    },

                                },
                                scales: {
                                    x: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            color: '#ffffff',
                                            // This more specific font property overrides the global property
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 550,
                                            }
                                        },
                                    },
                                    y: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            beginAtZero: true,
                                            // min: 8,
                                            // max: 10,
                                            // stepSize: 2,
                                            color: '#ffffff',
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 500,

                                            }
                                        },

                                    },
                                },

                            },
                        }

                        const myChart = new Chart(ctx, chart);

                        const randomString = generateRandomString(10);


                        // Enregistrez l'image générée sur le disque (optionnel)
                        const buffer1 = canvas.toBuffer('image/png');
                        fs.writeFileSync("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "generatedchart.png", buffer1);


                        const image1 = await loadImage("./visual/rollschasers/permanent/portfoliotemplate.png");
                        const image2 = await loadImage("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "generatedchart.png");

                        const canvasFormatted = createCanvas(1500, 900);
                        const ctxFormatted = canvas.getContext('2d');

                        ctxFormatted.drawImage(image1, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                        ctxFormatted.drawImage(image2, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas

                        //Ecrire le nombre de wallet
                        ctxFormatted.font = "bold 14px Rockwell";
                        ctxFormatted.fillStyle = "#ffffff";
                        const textWidth2 = ctxFormatted.measureText("(" + walletCount + " wallets)").width;
                        ctxFormatted.fillText("(" + walletCount + " wallets)", (750 - textWidth2 / 2), 96);


                        // Dessiner l'image de profil sur le canvas
                        ctxFormatted.font = "bold 25px SFTransrobotic";
                        ctxFormatted.fillStyle = "#ffffff";
                        const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
                        ctxFormatted.fillText(authorName.toString(), (1470 - userNameSize), 856);

                        // Charger l'image de profil
                        const profileImage = await loadImage(userLogo);
                        const imagesize = 41;
                        const imagex = 1470 - userNameSize - imagesize - 10;
                        const imagey = 827;

                        ctxFormatted.beginPath();
                        ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                        ctxFormatted.closePath();
                        ctxFormatted.clip();
                        ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);




                        const buffer2 = canvas.toBuffer('image/png');



                        await interaction.editReply({

                            files: [buffer2],
                        });



                        // Supprime le fichier
                        fs.unlinkSync("./visual/rollschasers/temporary/" + randomString + "-" + authorId + "generatedchart.png");


                        //On stock les call API
                        for (let i = 0; i < timestampTable.length; i++) {
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBlock", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                        }


                    }


                } else {





                    if (selectedWallet !== "All") {

                        // Récupérer l'historique des prix sur 6 mois et définir le wallet
                        const timeStamp = Date.now();
                        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)

                        const timestamp0week = actualTimestamp
                        const timestamp1week = actualTimestamp - (604800 * 0.5)
                        const timestamp2week = actualTimestamp - (604800 * 1)
                        const timestamp3week = actualTimestamp - (604800 * 1.5)
                        const timestamp4week = actualTimestamp - (604800 * 2)
                        const timestamp5week = actualTimestamp - (604800 * 2.5)
                        const timestamp6week = actualTimestamp - (604800 * 3)
                        const timestamp7week = actualTimestamp - (604800 * 3.5)
                        const timestamp8week = actualTimestamp - (604800 * 4)
                        const timestamp9week = actualTimestamp - (604800 * 4.5)
                        const timestamp10week = actualTimestamp - (604800 * 5)
                        const timestamp11week = actualTimestamp - (604800 * 5.5)
                        const timestamp12week = actualTimestamp - (604800 * 6)
                        const timestamp13week = actualTimestamp - (604800 * 6.5)
                        const timestamp14week = actualTimestamp - (604800 * 7)
                        const timestamp15week = actualTimestamp - (604800 * 7.5)
                        const timestamp16week = actualTimestamp - (604800 * 8)
                        const timestamp17week = actualTimestamp - (604800 * 8.5)
                        const timestamp18week = actualTimestamp - (604800 * 9)
                        const timestamp19week = actualTimestamp - (604800 * 9.5)
                        const timestamp20week = actualTimestamp - (604800 * 10)
                        const timestamp21week = actualTimestamp - (604800 * 10.5)
                        const timestamp22week = actualTimestamp - (604800 * 11)
                        const timestamp23week = actualTimestamp - (604800 * 11.5)

                        let timestampTable = [timestamp23week, timestamp22week, timestamp21week, timestamp20week, timestamp19week, timestamp18week, timestamp17week, timestamp16week, timestamp15week, timestamp14week, timestamp13week, timestamp12week, timestamp11week, timestamp10week, timestamp9week, timestamp8week, timestamp7week, timestamp6week, timestamp5week, timestamp4week, timestamp3week, timestamp2week, timestamp1week, timestamp0week]


                        //Boucle pour crée les tableaux
                        for (const timestamp of timestampTable) {

                            roundCount++


                            let obj = {}

                            const date = new Date(timestamp * 1000);
                            const month = date.getMonth() + 1;
                            const day = date.getDate();
                            const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;


                            const getBlock = await axios.get('https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=' + timestamp + '&closest=before&apikey=' + etherscanApiKey)
                            const eth = await web3CloudflarePublic.eth.getBalance(selectedWallet, getBlock.data.result);
                            const ethValueSpecific = eth / (10 ** 18)



                            obj.position = roundCount
                            obj.timestamp = timestamp
                            obj.dateFormatted = formattedDate
                            obj.ethValue = ethValueSpecific


                            valueFullTable.push(obj)
                            ethValue.push(ethValueSpecific)
                            dateFormatted.push(formattedDate)
                        }


                        const canvas = createCanvas(1500, 900);
                        const ctx = canvas.getContext('2d');



                        // Initialisez un nouveau graphique Chart.js
                        const chart = {
                            type: 'line',
                            data: {
                                labels: dateFormatted, // labels pour les nombres de 1 à 12
                                datasets: [
                                    {
                                        data: ethValue, // Données à afficher sur le graphique
                                        fill: true,
                                        borderColor: '#ffffff', // Couleur de la ligne d'évolution
                                        borderWidth: 3.5,
                                        tension: 0.4,
                                        pointRadius: 0, // Définir la taille des points
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    },
                                ],
                            },
                            options: {
                                layout: {
                                    padding: {
                                        top: 85
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false, // Désactiver le label
                                    },

                                },
                                scales: {
                                    x: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            color: '#ffffff',
                                            // This more specific font property overrides the global property
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 550,
                                            }
                                        },
                                    },
                                    y: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            beginAtZero: true,
                                            // min: 8,
                                            // max: 10,
                                            // stepSize: 2,
                                            color: '#ffffff',
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 500,

                                            }
                                        },

                                    },
                                },

                            },
                        }

                        const myChart = new Chart(ctx, chart);


                        const randomString = generateRandomString(10);


                        // Enregistrez l'image générée sur le disque (optionnel)
                        const buffer1 = canvas.toBuffer('image/png');
                        fs.writeFileSync("./visual/aura/temporary/" + randomString + "-" + authorId + "generatedchart.png", buffer1);


                        const image1 = await loadImage("./visual/aura/permanent/portfoliotemplate.png");
                        const image2 = await loadImage("./visual/aura/temporary/" + randomString + "-" + authorId + "generatedchart.png");

                        const canvasFormatted = createCanvas(1500, 900);
                        const ctxFormatted = canvas.getContext('2d');

                        ctxFormatted.drawImage(image1, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                        ctxFormatted.drawImage(image2, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas



                        //NOM USER
                        ctxFormatted.font = "bold 25px 'Fira Code'";
                        ctxFormatted.fillStyle = "#ffffff";
                        const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
                        ctxFormatted.fillText(authorName.toString(), (1470 - userNameSize), 856);



                        // Charger l'image de profil
                        const profileImage = await loadImage(userLogo);
                        // Position de l'image
                        const imagesize = 41;
                        const imagex = 1470 - userNameSize - imagesize - 10;
                        const imagey = 827;


                        ctxFormatted.beginPath();
                        ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                        ctxFormatted.closePath();
                        ctxFormatted.clip();
                        ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);







                        //Nombre de wallets
                        ctxFormatted.font = "bold 14px Rockwell";
                        ctxFormatted.fillStyle = "#ffffff";
                        const textWidth2 = ctxFormatted.measureText("(1 wallet)").width;
                        ctxFormatted.fillText("(1 wallet)", (750 - textWidth2 / 2), 96);







                        const buffer2 = canvas.toBuffer('image/png');



                        await interaction.editReply({

                            files: [buffer2],
                        });


                        // Supprime le fichier
                        fs.unlinkSync("./visual/aura/temporary/" + randomString + "-" + authorId + "generatedchart.png");




                        //On stock les call API
                        for (let i = 0; i < timestampTable.length; i++) {
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBlock", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                        }



                    } else if (selectedWallet === "All") {

                        //On définit la plage de wallet
                        let allWalletAddressOfAuthorTable = []
                        const allWalletsOfAuthor = await wallets.findAll({ where: { authorId: authorId, walletCategory: "eth" } });
                        for (let i = 0; i < allWalletsOfAuthor.length; i++) { allWalletAddressOfAuthorTable.push(allWalletsOfAuthor[i].dataValues.walletAddress); }

                        let walletCount = allWalletAddressOfAuthorTable.length



                        // Récupérer l'historique des prix sur 6 mois et définir le wallet
                        const timeStamp = Date.now();
                        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)

                        const timestamp0week = actualTimestamp
                        const timestamp2week = actualTimestamp - (604800 * 1)
                        const timestamp4week = actualTimestamp - (604800 * 2)
                        const timestamp6week = actualTimestamp - (604800 * 3)
                        const timestamp8week = actualTimestamp - (604800 * 4)
                        const timestamp10week = actualTimestamp - (604800 * 5)
                        const timestamp12week = actualTimestamp - (604800 * 6)
                        const timestamp14week = actualTimestamp - (604800 * 7)
                        const timestamp16week = actualTimestamp - (604800 * 8)
                        const timestamp18week = actualTimestamp - (604800 * 9)
                        const timestamp20week = actualTimestamp - (604800 * 10)
                        const timestamp22week = actualTimestamp - (604800 * 11)

                        let timestampTable = [timestamp22week, timestamp20week, timestamp18week, timestamp16week, timestamp14week, timestamp12week, timestamp10week, timestamp8week, timestamp6week, timestamp4week, timestamp2week, timestamp0week]


                        //Boucle pour crée les tableaux
                        for (const timestamp of timestampTable) {

                            let ethValueSpecific = 0

                            for (const selectedWallet of allWalletAddressOfAuthorTable) {

                                const getBlock = await axios.get('https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=' + timestamp + '&closest=before&apikey=' + etherscanApiKey)
                                const eth = await web3CloudflarePublic.eth.getBalance(selectedWallet, getBlock.data.result);
                                ethValueSpecific += eth / (10 ** 18)

                            }
                            roundCount++



                            let obj = {}

                            const date = new Date(timestamp * 1000);
                            const month = date.getMonth() + 1;
                            const day = date.getDate();
                            const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;




                            obj.position = roundCount
                            obj.timestamp = timestamp
                            obj.dateFormatted = formattedDate
                            obj.ethValue = ethValueSpecific


                            valueFullTable.push(obj)
                            ethValue.push(ethValueSpecific)
                            dateFormatted.push(formattedDate)
                        }




                        const canvas = createCanvas(1500, 900);
                        const ctx = canvas.getContext('2d');



                        // Initialisez un nouveau graphique Chart.js
                        const chart = {
                            type: 'line',
                            data: {
                                labels: dateFormatted, // labels pour les nombres de 1 à 12
                                datasets: [
                                    {
                                        data: ethValue, // Données à afficher sur le graphique
                                        fill: true,
                                        borderColor: '#ffffff', // Couleur de la ligne d'évolution
                                        borderWidth: 3.5,
                                        tension: 0.4,
                                        pointRadius: 0, // Définir la taille des points
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    },
                                ],
                            },
                            options: {
                                layout: {
                                    padding: {
                                        top: 85
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false, // Désactiver le label
                                    },

                                },
                                scales: {
                                    x: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            color: '#ffffff',
                                            // This more specific font property overrides the global property
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 550,
                                            }
                                        },
                                    },
                                    y: {

                                        grid: {
                                            display: false, // Désactiver la grille de la ligne du bas
                                        },
                                        ticks: {
                                            beginAtZero: true,
                                            // min: 8,
                                            // max: 10,
                                            // stepSize: 2,
                                            color: '#ffffff',
                                            font: {
                                                size: 10,
                                                family: "Rockwell",
                                                weight: 500,

                                            }
                                        },

                                    },
                                },

                            },
                        }

                        const myChart = new Chart(ctx, chart);

                        const randomString = generateRandomString(10);


                        // Enregistrez l'image générée sur le disque (optionnel)
                        const buffer1 = canvas.toBuffer('image/png');
                        fs.writeFileSync("./visual/aura/temporary/" + randomString + "-" + authorId + "generatedchart.png", buffer1);


                        const image1 = await loadImage("./visual/aura/permanent/portfoliotemplate.png");
                        const image2 = await loadImage("./visual/aura/temporary/" + randomString + "-" + authorId + "generatedchart.png");

                        const canvasFormatted = createCanvas(1500, 900);
                        const ctxFormatted = canvas.getContext('2d');

                        ctxFormatted.drawImage(image1, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas
                        ctxFormatted.drawImage(image2, 0, 0, canvasFormatted.width, canvasFormatted.height); // Ajouter l'image de fond au canvas

                        // //Ecrire le nombre de wallet
                        // ctxFormatted.font = "bold 14px 'Fira Code'";
                        // ctxFormatted.fillStyle = "#ffffff";
                        // const textWidth2 = ctxFormatted.measureText("(" + walletCount + " wallets)").width;
                        // ctxFormatted.fillText("(" + walletCount + " wallets)", (750 - textWidth2 / 2), 96);


                        // Dessiner l'image de profil sur le canvas
                        ctxFormatted.font = "bold 25px 'Fira Code'";
                        ctxFormatted.fillStyle = "#ffffff";
                        const userNameSize = ctxFormatted.measureText(authorName.toString()).width;
                        ctxFormatted.fillText(authorName.toString(), (1470 - userNameSize), 856);

                        // Charger l'image de profil
                        const profileImage = await loadImage(userLogo);
                        const imagesize = 41;
                        const imagex = 1470 - userNameSize - imagesize - 10;
                        const imagey = 827;

                        ctxFormatted.beginPath();
                        ctxFormatted.arc(imagex + imagesize / 2, imagey + imagesize / 2, imagesize / 2, 0, Math.PI * 2, true);
                        ctxFormatted.closePath();
                        ctxFormatted.clip();
                        ctxFormatted.drawImage(profileImage, imagex, imagey, imagesize, imagesize);




                        const buffer2 = canvas.toBuffer('image/png');



                        await interaction.editReply({

                            files: [buffer2],
                        });


                        // Supprime le fichier
                        fs.unlinkSync("./visual/aura/temporary/" + randomString + "-" + authorId + "generatedchart.png");



                        //On stock les call API
                        for (let i = 0; i < timestampTable.length; i++) {
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBlock", apiProvider: "etherscan", timestamp: timeStamp.toString() })
                            await apimonitorsql.create({ serverId: serverId.toString(), commandName: "/portfolio-chartGenerator", apiCallName: "getBalance", apiProvider: "web3.eth", timestamp: timeStamp.toString() })
                        }


                    }


                }


            } else {

                const setfpEmbedNotForYou = new EmbedBuilder().setColor("#060A8F")
                    .setTitle("Bot Access")
                    .setAuthor({ name: authorName, iconURL: userAvatar })
                    .setDescription("This button is not for you. You can only click on buttons generated by your commands. Please try again with your personal data.")
                    .setThumbnail('https://cdn.discordapp.com/attachments/1108757847208099941/1133190291428479016/image.png')
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })

                await interaction.reply({ embeds: [setfpEmbedNotForYou], ephemeral: true });



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
            let reportCommand = "/portfolio-chart"

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
                .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' })


            await interaction.editReply({ embeds: [errorAnswerUser], ephemeral: true });


        }
    },
};




