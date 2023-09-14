
const { EmbedBuilder } = require("discord.js");
const { apimonitorsql, apiproviderssql, adminsql, paymentHistory, accessSql, interactionData, reportsql, sequelize, erc20 } = require('./database')

const erc20Standard = require("../contracts/uniswap/erc20standart.json")
const erc721Standard = require("../contracts/blur/erc721standard.json")
const factoryContractAbi = require("../contracts/uniswap/factory.json")


const formatCoinValueSign = require("../functions/formatNumberEmbed")
const reduceText = require("../functions/reducetext")
const contractType = require("../functions/contracttype")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey
const etherscanApiKey = process.env.etherscanApiKey



const Web3 = require('web3');
const web3 = new Web3("https://cloudflare-eth.com")

const axios = require('axios')



function formatWallet(input) {
    return input.length > 35 ? `${input.substring(0, 6)}…${input.substring(input.length - 6)}` : input;
}


// On définit le client et charge les channels
const client = require('../bot'); // Chemin vers le fichier client.js

let serverId = ""
let channelNewVerifiedId = ""
let channelNewVerified = ""

setTimeout(() => {

    const botId = client.user.id;

    if (botId == "1074328639165964368") {
        // PROD

        serverId = "1108754348818845729"
        channelNewVerifiedId = "1150894803794538577"

    } else if (botId == "1119666128411709552") {
        // DEV

        serverId = "1071576735298113667"
        channelNewVerifiedId = "1104225853023461388"
    }

    const botGuild = client.guilds.cache.get(serverId);
    channelNewVerified = botGuild.channels.cache.get(channelNewVerifiedId);

}, 4000);


// On définit les constantes et variables principales
const factoryContractAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const wETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"


// Création de l'instance du Factory Contract
const factoryContract = new web3.eth.Contract(factoryContractAbi, factoryContractAddress);





// STEP 1
async function headerGenerator() {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0",
        "Mozilla/5.0 (X11; Linux i686; rv:97.0) Gecko/20100101 Firefox/97.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 12.2; rv:97.0) Gecko/20100101 Firefox/97.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 OPR/83.0.4254.27",
        "Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 OPR/83.0.4254.27",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 OPR/83.0.4254.27"
    ];



    const header = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Cookie': '__stripe_mid=91e56e36-e45d-42f5-aab8-5537715bdee0163d98; etherscan_cookieconsent=True; bitmedia_fid=eyJmaWQiOiJmMjg5ZTAzZGM1NTBhMmVjMzgwNTRmMGRlMzIyZGNlOSIsImZpZG5vdWEiOiJkYTdhM2C1mknfrm; displaymode=dark; _gid=GA1.2.1657669023.1693735988; _ga_NHZNQE2B8K=GS1.1.1693954828.1.0.1693954837.0.0.0; etherscan_offset_datetime=+2; etherscan_switch_age_datetime=Age; ASP.NET_SessionId=odrreimxzb43gig1x3mknfrm; __cflb=02DiuFnsSsHWYH8WqVXcJWaecAw5gpnmePmY7x43F4dvU; __cuid=0516ae0c242b4a7ca7cc569625b39a65; amp_fef1e8=f08cf647-d966-40f8-a5cf-b26f8a15f015R...1ha0i4mmr.1ha0issio.aq.24.cu; _ga_T1JC9RNQXV=GS1.1.1694398639.212.0.1694398639.0.0.0; _ga=GA1.2.2080887961.1669430908; _gat_gtag_UA_46998878_6=1; cf_clearance=7L_quizT2.146KQLYNbFH64aeJLivDlESIGCUqojOF0-1694398640-0-1-1f2de22f.b0c0dfb0.139b2313-0.2.1694398640',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
    };

     return header;
}

// STEP 2
async function getSourceCode() {



    let headers = headerGenerator();

    async function fetchDataWithRetries() {

        while (true) {
            const response = await fetch('https://etherscan.io/contractsVerified', {
                headers: headers,
                timeout: 5000
                // Utilisez l'en-tête généré ici
            })

            if (response.status === 200) {
                const content = await response.text();
                return content;
            } else {
                console.log("Retrying... " + response.status);
                headers = pickRandomUserAgent();
            }


        }
    }

    const htmlContent = await fetchDataWithRetries();
    return htmlContent;
}

// STEP 3
async function getVerifiedContracts() {

    const ethereumAddresses = [];

    const html = await getSourceCode()
        .then(async (html) => {

            // Extract the verified contracts from the HTML
            const addressIndetify = html.match(/title="(0x[a-fA-F0-9]{40})" href="\/address\/0x[a-fA-F0-9]{40}#code"/g)
            const txnCountIdentify = html.match(/ETH<\/td>\s*<td>(\d+)<\/td>\s*<td>/g)

            console.log(txnCountIdentify)
            let index = 0

            for (const item of addressIndetify) {
                const regex0x = /title="(0x[a-fA-F0-9]{40})" href="\/address\/\1#code"/;
                const match = item.match(regex0x);

                const item2 = txnCountIdentify[index]
                const match2 = item2.match(/ETH<\/td><td>(\d+)<\/td><td>/);
                console.log(item2)
                console.log(match2[1])
                if (match) {

                    let obj = {}

                    const ethereumAddress = match[1];
                    obj.contract = ethereumAddress

                    if (match2) {

                        const txnCount = match2[1];
                        obj.txn = txnCount

                    } else {

                        obj.txn = 1

                    }
                     ethereumAddresses.push(obj)

                }
                index++
            }

            ethereumAddresses.reverse();

           // console.log(ethereumAddresses)
            console.log("nouveaux contrats retourné")






        })
        .catch((error) => {
            console.error("Impossible de retrouver les addresses dans le source code : " + error);
        });



    return ethereumAddresses

}


// STEP 4
async function executeNewVerified() {


    try {

        const timeStamp = Date.now();
        const actualTimestamp = parseFloat(timeStamp / 1000).toFixed(0)
        let createdSince = "<t:" + actualTimestamp + ":R>"

        const ercData = await erc20.findAll()
        const scrappedContracts = await getVerifiedContracts()

        //console.log("scrapped = " + scrappedContracts)


        const registerContractsUnverfied = ercData.filter((contrat) => contrat.dataValues.verified == null).map((contrat) => contrat.dataValues.contractAddress.toLowerCase());
        const registerContractsVerified = ercData.filter((contrat) => contrat.dataValues.verified != null).map((contrat) => contrat.dataValues.contractAddress.toLowerCase());

        const newContracts = scrappedContracts.filter((adresse) => !registerContractsUnverfied.includes(adresse.contract.toLowerCase()) && !registerContractsVerified.includes(adresse.contract.toLowerCase()));
        const unverifiedContracts = scrappedContracts.filter((adresse) => registerContractsUnverfied.includes(adresse.contract.toLowerCase()) && !registerContractsVerified.includes(adresse.contract.toLowerCase()));

        // Pour les nouveau contrats
        for (const contractObj of newContracts) {


            try {

                const contractAddress = contractObj.contract
                const txnCount = contractObj.txn

                const contract = contractAddress.toLowerCase()

                const callABI = await axios.get("https://api.etherscan.io/api?module=contract&action=getsourcecode&address=" + contractAddress + "&apikey=" + etherscanApiKey)
                const ABI = await JSON.parse(callABI.data.result[0].ABI)
                const sourceCode = callABI.data.result[0].SourceCode

                // IS PROXY
                let isProxy = callABI.data.result[0].Proxy
                if (isProxy == "0") { isProxy = "No" }
                else if (isProxy == "1") { isProxy = "Yes" }

                const filteredAbi = ABI.filter(item => item.stateMutability !== 'pure' && item.stateMutability !== 'view' && item.type == 'function');
                const notableAbi = filteredAbi.filter(item => (item.name.toLowerCase()).includes("mint") || (item.name.toLowerCase()).includes("swap") || (item.name.toLowerCase()).includes("approve") || (item.name.toLowerCase()).includes("claim"));


                let contractType = "N/A"
                let notableFunctionsFormatted = ""

                // On définit la nature du contrat
                const functionNames = ABI.map((item) => item.name);
                const hasERC721Functions =
                    functionNames.includes('ownerOf') &&
                    functionNames.includes('name') &&
                    functionNames.includes('symbol')
                //functionNames.includes('approve');

                const hasERC20Functions =
                    functionNames.includes('name') &&
                    functionNames.includes('symbol') &&
                    functionNames.includes('balanceOf') &&
                    !functionNames.includes('ownerOf');

                if (hasERC721Functions) {
                    contractType = 'ERC721';
                } else if (hasERC20Functions) {
                    contractType = 'ERC20';
                } else { contractType = 'Random' }

                console.log(contractType)

                notableAbi.sort((a, b) => {

                    const customOrder = ['mint', 'claim', 'swap', 'approve'];

                    const nameA = a.name.toLowerCase();
                    const nameB = b.name.toLowerCase();
                    const indexA = customOrder.indexOf(nameA);
                    const indexB = customOrder.indexOf(nameB);
                    return indexA - indexB;
                });


                for (const notableFunction of notableAbi) {

                    let name = notableFunction.name
                    let inputs = notableFunction.inputs
                    let type = notableFunction.stateMutability

                    let inputsFormatted = ""
                    let index = 0

                    for (const input of inputs) {

                        let inputName = input.name

                        inputsFormatted += inputName

                        index++

                        if (index != inputs.length) { inputsFormatted += ", " }

                    }


                    notableFunctionsFormatted += name + "(" + inputsFormatted + ")\n"


                }


                let decimals = ""
                let owner = ""
                let name = ""
                let symbol = ""
                let totalSupply = ""

                let ownerBalance = ""
                let devBalance = ""
                let deployer = ""
                let deployerBalance = ""
                let ownership = ""

                let isLive = "❌ No"

                let telegramLinks = [];
                let twitterLinks = [];
                let websiteLinks = [];
                let socialsFormatted = ""




                if (contractType == "ERC20") {




                    // Obtenir les détails du contrat
                    const contractInstance = new web3.eth.Contract(ABI, contract);
                    console.log(contract)
                    decimals = await contractInstance.methods.decimals().call();
                    name = await contractInstance.methods.name().call();
                    symbol = await contractInstance.methods.symbol().call();
                    supply = await contractInstance.methods.totalSupply().call();
                    totalSupply = supply / 10 ** decimals
                    try {
                        owner = await contractInstance.methods.owner().call()
                    } catch (err) {
                        console.log("No owner found")
                        owner = "N/A"
                    }



                    const callCreation = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + contract + "&apikey=" + etherscanApiKey)
                    deployer = await callCreation.data.result[0].contractCreator


                    const balanceOfDeployer = await contractInstance.methods.balanceOf(deployer).call();
                    deployerBalance = balanceOfDeployer / 10 ** decimals

                    if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                        ownership = "✅ Renounced"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else if (owner == "N/A") {

                        ownership = "⚠️ No data"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else {

                        if (owner.toLowerCase() != deployer.toLowerCase()) {

                            const balanceOfOwner = await contractInstance.methods.balanceOf(owner).call();
                            ownerBalance = balanceOfOwner / 10 ** decimals

                        }

                        ownership = "❌ Not renounced"
                        devBalance = formatCoinValueSign(deployerBalance + ownerBalance) + " (" + parseFloat(((deployerBalance + ownerBalance) / totalSupply) * 100).toFixed(1) + "%)"

                    }



                    // Est ce que la paire est live
                    const getPair = await factoryContract.methods.getPair(contract.toLowerCase(), wETHAddress).call();
                    if (getPair == "0x0000000000000000000000000000000000000000") { isLive = "✅ Yes" }


                    // Contract Option






                    // Scrapper les liens dans le source code du contrat
                    const urlRegex = /(https?:\/\/[^\s]+)./g;

                    const urls = sourceCode.match(urlRegex);


                    if (urls) {
                        urls.forEach((url) => {
                            if (url.includes('t.me')) {
                                telegramLinks.push(url);
                            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                                twitterLinks.push(url);
                            } else if (!url.includes('github.com') && !url.includes('solidity') && !url.includes('stackexchange.com') && !url.includes('xn--2-umb.com')) {
                                websiteLinks.push(url);
                            }
                        });
                    }

                    if (telegramLinks.length > 0 && twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && twitterLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")" }
                    else if (twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else { socialsFormatted = ">>> No socials found" }


                    if (notableFunctionsFormatted == "") { notableFunctionsFormatted = "No notable function found" }



                    const verifiedERC20 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                        .setDescription(">>> A new ERC20 contract has been verified")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Contract", value: "`" + contract.toLowerCase() + "`", inline: false },
                            { name: "Contract Verified", value: "`✅ Verified`", inline: true },
                            { name: "Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                            { name: "Type", value: "`" + contractType.toUpperCase() + "`", inline: true },
                            { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                            { name: "Txn Count", value: "`" + txnCount + "`", inline: true },
                            { name: "Ownership", value: "`" + ownership + "`", inline: true },
                            { name: "Proxy", value: "`" + isProxy + "`", inline: true },
                            { name: "Pair Live", value: "`" + isLive + "`", inline: true },
                            { name: "Verified Since", value: createdSince, inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Notable Functions:", value: "```" + notableFunctionsFormatted + "```", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Socials", value: socialsFormatted, inline: true },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + contract + ")", inline: false },
                            { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + contract + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + contract + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + contract + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + contract + "&group=Default)", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    
                    await channelNewVerified.send({ embeds: [verifiedERC20] });


                    

                    // //On enregistre les infos du token
                    // let infoTable = []
                    // let obj = {}
                    // obj.supply = totalSupply
                    // obj.deployer = deployer.toLowerCase()
                    // obj.deployerBalance = deployerBalance
                    // obj.owner = owner.toLowerCase()
                    // obj.ownerBalance = ownerBalance
                    // obj.decimals = decimals
                    // obj.proxy = isProxy
                    // obj.links = socialsFormatted
                    // infoTable.push(obj)

                    //On enregistre le call
                    erc20.create({
                        interactionId: "1",
                        contractAddress: contract,
                       // name: name.toString(),
                       // symbol: symbol.toString(),
                       // type: contractType,
                       // table1: JSON.stringify(infoTable),
                      //  abi: JSON.stringify(ABI),
                       // notableFunctions: JSON.stringify(notableAbi),
                       // sourceCode: sourceCode,
                        verified: actualTimestamp

                    })


                } else if (contractType == "ERC721") {





                    // Obtenir les détails du contrat
                    const contractInstance = new web3.eth.Contract(ABI, contract);
                    console.log(contract)
                    name = await contractInstance.methods.name().call();
                    symbol = await contractInstance.methods.symbol().call();
                    totalSupply = await contractInstance.methods.totalSupply().call();

                    try {
                        owner = await contractInstance.methods.owner().call()
                    } catch (err) {
                        console.log("No owner found")
                        owner = "N/A"
                    }


                    const callCreation = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + contract + "&apikey=" + etherscanApiKey)
                    deployer = await callCreation.data.result[0].contractCreator


                    const balanceOfDeployer = await contractInstance.methods.balanceOf(deployer).call();
                    deployerBalance = balanceOfDeployer

                    if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                        ownership = "✅ Renounced"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else if (owner == "N/A") {

                        ownership = "⚠️ No data"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else {

                        if (owner.toLowerCase() != deployer.toLowerCase()) {

                            const balanceOfOwner = await contractInstance.methods.balanceOf(owner).call();
                            ownerBalance = balanceOfOwner

                        }

                        ownership = "❌ Not renounced"
                        devBalance = formatCoinValueSign(deployerBalance + ownerBalance) + " (" + parseFloat(((deployerBalance + ownerBalance) / totalSupply) * 100).toFixed(1) + "%)"

                    }




                    // Est ce que la paire est live
                    const getPair = await factoryContract.methods.getPair(contract.toLowerCase(), wETHAddress).call();
                    if (getPair == "0x0000000000000000000000000000000000000000") { isLive = "✅ Yes" }




                    const urlRegex = /(https?:\/\/[^\s]+)./g;

                    const urls = sourceCode.match(urlRegex);


                    if (urls) {
                        urls.forEach((url) => {
                            if (url.includes('t.me')) {
                                telegramLinks.push(url);
                            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                                twitterLinks.push(url);
                            } else if (!url.includes('github.com') && !url.includes('solidity') && !url.includes('stackexchange.com') && !url.includes('xn--2-umb.com')) {
                                websiteLinks.push(url);
                            }
                        });
                    }

                    if (telegramLinks.length > 0 && twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && twitterLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")" }
                    else if (twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else { socialsFormatted = ">>> No socials found" }



                    if (notableFunctionsFormatted == "") { notableFunctionsFormatted = "No notable function found" }


                    const verifiedERC20 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                        .setDescription(">>> A new ERC721 contract has been verified")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Contract", value: "`" + contract.toLowerCase() + "`", inline: false },
                            { name: "Contract Verified", value: "`✅ Verified`", inline: true },
                            { name: "Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                            { name: "Type", value: "`" + contractType.toUpperCase() + "`", inline: true },
                            { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                            { name: "Txn Count", value: "`" + txnCount + "`", inline: true },
                            { name: "Ownership", value: "`" + ownership + "`", inline: true },
                            { name: "Proxy", value: "`" + isProxy + "`", inline: true },
                            { name: "Pair Live", value: "`" + isLive + "`", inline: true },
                            { name: "Verified Since", value: createdSince, inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Notable Functions:", value: "```" + notableFunctionsFormatted + "```", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Socials", value: socialsFormatted, inline: true },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[Opensea](https://opensea.io/collection/' + contract + ") ∙ " + '[Blur](https://blur.io/collection/' + contract + ") ∙ " + '[Magically](https://magically.gg/collection/' + contract + ") ∙ " + '[Holders](https://blur.io/collection/' + contract + "/holders) ∙ " + '[Deployer](https://etherscan.io/address/' + deployer + ")", inline: false },
                            //{ name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + contract + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + contract + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + contract + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + contract + "&group=Default)", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    
                    await channelNewVerified.send({ embeds: [verifiedERC20] });





                    // //On enregistre les infos du token
                    // let infoTable = []
                    // let obj = {}
                    // obj.supply = totalSupply
                    // obj.deployer = deployer.toLowerCase()
                    // obj.deployerBalance = deployerBalance
                    // obj.owner = owner.toLowerCase()
                    // obj.ownerBalance = ownerBalance
                    // obj.decimals = decimals
                    // obj.proxy = isProxy
                    // obj.links = socialsFormatted
                    // infoTable.push(obj)

                    //On enregistre le call
                    erc20.create({
                        interactionId: "1",
                        contractAddress: contract,
                       // name: name.toString(),
                       // symbol: symbol.toString(),
                       // type: contractType,
                       // table1: JSON.stringify(infoTable),
                      //  abi: JSON.stringify(ABI),
                       // notableFunctions: JSON.stringify(notableAbi),
                       // sourceCode: sourceCode,
                        verified: actualTimestamp

                    })



                }




            } catch (error) {

                console.log("Erreur lors de la récupération des informations, try catch de boucle ")
                console.log(error)


            }


        }



        // Pour les contrats déjà présent
        for (const contractObj of unverifiedContracts) {

            try {

                const contractAddress = contractObj.contract
                const txnCount = contractObj.txn

                const contract = contractAddress.toLowerCase()


                const callABI = await axios.get("https://api.etherscan.io/api?module=contract&action=getsourcecode&address=" + contractAddress + "&apikey=" + etherscanApiKey)
                const ABI = await JSON.parse(callABI.data.result[0].ABI)
                const sourceCode = callABI.data.result[0].SourceCode

                // IS PROXY
                let isProxy = callABI.data.result[0].Proxy
                if (isProxy == "0") { isProxy = "No" }
                else if (isProxy == "1") { isProxy = "Yes" }

                const filteredAbi = ABI.filter(item => item.stateMutability !== 'pure' && item.stateMutability !== 'view' && item.type == 'function');
                const notableAbi = filteredAbi.filter(item => (item.name.toLowerCase()).includes("mint") || (item.name.toLowerCase()).includes("swap") || (item.name.toLowerCase()).includes("approve") || (item.name.toLowerCase()).includes("claim"));


                let contractType = "N/A"
                let notableFunctionsFormatted = ""

                // On définit la nature du contrat
                const functionNames = ABI.map((item) => item.name);
                const hasERC721Functions =
                    functionNames.includes('ownerOf') &&
                    functionNames.includes('name') &&
                    functionNames.includes('symbol')
                //functionNames.includes('approve');

                const hasERC20Functions =
                    functionNames.includes('name') &&
                    functionNames.includes('symbol') &&
                    functionNames.includes('balanceOf') &&
                    !functionNames.includes('ownerOf');

                if (hasERC721Functions) {
                    contractType = 'ERC721';
                } else if (hasERC20Functions) {
                    contractType = 'ERC20';
                } else { contractType = 'Random' }

                console.log(contractType)

                notableAbi.sort((a, b) => {

                    const customOrder = ['mint', 'claim', 'swap', 'approve'];

                    const nameA = a.name.toLowerCase();
                    const nameB = b.name.toLowerCase();
                    const indexA = customOrder.indexOf(nameA);
                    const indexB = customOrder.indexOf(nameB);
                    return indexA - indexB;
                });


                for (const notableFunction of notableAbi) {

                    let name = notableFunction.name
                    let inputs = notableFunction.inputs
                    let type = notableFunction.stateMutability

                    let inputsFormatted = ""
                    let index = 0

                    for (const input of inputs) {

                        let inputName = input.name

                        inputsFormatted += inputName

                        index++

                        if (index != inputs.length) { inputsFormatted += ", " }

                    }


                    notableFunctionsFormatted += name + "(" + inputsFormatted + ")\n"


                }


                let decimals = ""
                let owner = ""
                let name = ""
                let symbol = ""
                let totalSupply = ""

                let ownerBalance = ""
                let devBalance = ""
                let deployer = ""
                let deployerBalance = ""
                let ownership = ""

                let isLive = "❌ No"

                let telegramLinks = [];
                let twitterLinks = [];
                let websiteLinks = [];
                let socialsFormatted = ""




                if (contractType == "ERC20") {




                    // Obtenir les détails du contrat
                    const contractInstance = new web3.eth.Contract(ABI, contract);
                    console.log(contract)
                    decimals = await contractInstance.methods.decimals().call();
                    name = await contractInstance.methods.name().call();
                    symbol = await contractInstance.methods.symbol().call();
                    supply = await contractInstance.methods.totalSupply().call();
                    totalSupply = supply / 10 ** decimals
                    try {
                        owner = await contractInstance.methods.owner().call()
                    } catch (err) {
                        console.log("No owner found")
                        owner = "N/A"
                    }


                    const callCreation = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + contract + "&apikey=" + etherscanApiKey)
                    deployer = await callCreation.data.result[0].contractCreator


                    const balanceOfDeployer = await contractInstance.methods.balanceOf(deployer).call();
                    deployerBalance = balanceOfDeployer / 10 ** decimals

                    if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                        ownership = "✅ Renounced"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else if (owner == "N/A") {

                        ownership = "⚠️ No data"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else {

                        if (owner.toLowerCase() != deployer.toLowerCase()) {

                            const balanceOfOwner = await contractInstance.methods.balanceOf(owner).call();
                            ownerBalance = balanceOfOwner / 10 ** decimals

                        }

                        ownership = "❌ Not renounced"
                        devBalance = formatCoinValueSign(deployerBalance + ownerBalance) + " (" + parseFloat(((deployerBalance + ownerBalance) / totalSupply) * 100).toFixed(1) + "%)"

                    }



                    // Est ce que la paire est live
                    const getPair = await factoryContract.methods.getPair(contract.toLowerCase(), wETHAddress).call();
                    if (getPair == "0x0000000000000000000000000000000000000000") { isLive = "✅ Yes" }


                    // Contract Option






                    // Scrapper les liens dans le source code du contrat
                    const urlRegex = /(https?:\/\/[^\s]+)./g;

                    const urls = sourceCode.match(urlRegex);


                    if (urls) {
                        urls.forEach((url) => {
                            if (url.includes('t.me')) {
                                telegramLinks.push(url);
                            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                                twitterLinks.push(url);
                            } else if (!url.includes('github.com') && !url.includes('solidity') && !url.includes('stackexchange.com') && !url.includes('xn--2-umb.com')) {
                                websiteLinks.push(url);
                            }
                        });
                    }

                    if (telegramLinks.length > 0 && twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && twitterLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")" }
                    else if (twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else { socialsFormatted = ">>> No socials found" }



                    if (notableFunctionsFormatted == "") { notableFunctionsFormatted = "No notable function found" }


                    const verifiedERC20 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                        .setDescription(">>> A new ERC20 contract has been verified")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Contract", value: "`" + contract.toLowerCase() + "`", inline: false },
                            { name: "Contract Verified", value: "`✅ Verified`", inline: true },
                            { name: "Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                            { name: "Type", value: "`" + contractType.toUpperCase() + "`", inline: true },
                            { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                            { name: "Txn Count", value: "`" + txnCount + "`", inline: true },
                            { name: "Ownership", value: "`" + ownership + "`", inline: true },
                            { name: "Proxy", value: "`" + isProxy + "`", inline: true },
                            { name: "Pair Live", value: "`" + isLive + "`", inline: true },
                            { name: "Verified Since", value: createdSince, inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Notable Functions:", value: "```" + notableFunctionsFormatted + "```", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Socials", value: socialsFormatted, inline: true },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[DexScreener](https://dexscreener.com/ethereum/' + contract + ") ∙ " + '[DexSpy](https://dexspy.io/eth/token/' + contract + ") ∙ " + '[Uniswap](https://app.uniswap.org/#/tokens/ethereum/' + contract + ") ∙ " + '[DefiLlama](https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&to=' + contract + ") ∙ " + '[DexAnalyzer](https://www.dexanalyzer.io/token/' + contract + ") ∙ " + '[Honeypot](   https://honeypot.is/ethereum?address=' + contract + ") ∙ " + '[Holders](https://etherscan.io/token/tokenholderchart/' + contract + ")", inline: false },
                            { name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + contract + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + contract + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + contract + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + contract + "&group=Default)", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    
                    await channelNewVerified.send({ embeds: [verifiedERC20] });



                    // // On enregistre les infos du token
                    // const tokenInfos = ercData.filter((contrat) => contrat.dataValues.contractAddress == contract.toLowerCase())

                    // let infoTable = JSON.parse(tokenInfos[0].dataValues.table1)

                    // infoTable[0].proxy = isProxy
                    // infoTable[0].links = socialsFormatted

                    // await erc20.update({
                    //     table1: JSON.stringify(infoTable),
                    //     abi: JSON.stringify(ABI),
                    //     notableFunctions: JSON.stringify(notableAbi),
                    //     sourceCode: sourceCode,
                    //     verified: actualTimestamp,
                    // },
                    //     { where: { contractAddrese: contract.toLowerCase() } })



                } else if (contractType == "ERC721") {





                    // Obtenir les détails du contrat
                    const contractInstance = new web3.eth.Contract(ABI, contract);
                    console.log(contract)
                    name = await contractInstance.methods.name().call();
                    symbol = await contractInstance.methods.symbol().call();
                    totalSupply = await contractInstance.methods.totalSupply().call();

                    try {
                        owner = await contractInstance.methods.owner().call()
                    } catch (err) {
                        console.log("No owner found")
                        owner = "N/A"
                    }


                    const callCreation = await axios.get("https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=" + contract + "&apikey=" + etherscanApiKey)
                    deployer = await callCreation.data.result[0].contractCreator


                    const balanceOfDeployer = await contractInstance.methods.balanceOf(deployer).call();
                    deployerBalance = balanceOfDeployer 

                    if (owner.toLowerCase() == "0x0000000000000000000000000000000000000000" || owner.toLowerCase() == "0x000000000000000000000000000000000000dead") {

                        ownership = "✅ Renounced"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else if (owner == "N/A") {

                        ownership = "⚠️ No data"
                        devBalance = formatCoinValueSign(deployerBalance) + " (" + parseFloat((deployerBalance / totalSupply) * 100).toFixed(1) + "%)"

                    } else {

                        if (owner.toLowerCase() != deployer.toLowerCase()) {

                            const balanceOfOwner = await contractInstance.methods.balanceOf(owner).call();
                            ownerBalance = balanceOfOwner 

                        }

                        ownership = "❌ Not renounced"
                        devBalance = formatCoinValueSign(deployerBalance + ownerBalance) + " (" + parseFloat(((deployerBalance + ownerBalance) / totalSupply) * 100).toFixed(1) + "%)"

                    }




                    // Est ce que la paire est live
                    const getPair = await factoryContract.methods.getPair(contract.toLowerCase(), wETHAddress).call();
                    if (getPair == "0x0000000000000000000000000000000000000000") { isLive = "✅ Yes" }




                    const urlRegex = /(https?:\/\/[^\s]+)./g;

                    const urls = sourceCode.match(urlRegex);


                    if (urls) {
                        urls.forEach((url) => {
                            if (url.includes('t.me')) {
                                telegramLinks.push(url);
                            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                                twitterLinks.push(url);
                            } else if (!url.includes('github.com') && !url.includes('solidity') && !url.includes('stackexchange.com') && !url.includes('xn--2-umb.com')) {
                                websiteLinks.push(url);
                            }
                        });
                    }

                    if (telegramLinks.length > 0 && twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && twitterLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '<:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")" }
                    else if (twitterLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TWLogo:1150854037575585854> [Twitter](' + twitterLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else if (telegramLinks.length > 0 && websiteLinks.length > 0) { socialsFormatted = '>>> <:TGLogo:1150854169188630558> [Telegram](' + telegramLinks[0] + ")\n" + '🌐 [Website](' + websiteLinks[0] + ")" }
                    else { socialsFormatted = ">>> No socials found" }


                    if (notableFunctionsFormatted == "") { notableFunctionsFormatted = "No notable function found" }



                    const verifiedERC20 = new EmbedBuilder().setColor("#060A8F")
                        .setTitle(reduceText(name, 40) + " (" + symbol.toUpperCase() + ")")
                        .setDescription(">>> A new ERC721 contract has been verified")
                        .addFields(
                            { name: " ", value: " ", inline: false },
                            { name: "Contract", value: "`" + contract.toLowerCase() + "`", inline: false },
                            { name: "Contract Verified", value: "`✅ Verified`", inline: true },
                            { name: "Supply", value: "`" + formatCoinValueSign(totalSupply, 2) + "`", inline: true },
                            { name: "Type", value: "`" + contractType.toUpperCase() + "`", inline: true },
                            { name: "Dev. Balance", value: "`" + devBalance + "`", inline: true },
                            { name: "Txn Count", value: "`" + txnCount + "`", inline: true },
                            { name: "Ownership", value: "`" + ownership + "`", inline: true },
                            { name: "Proxy", value: "`" + isProxy + "`", inline: true },
                            { name: "Pair Live", value: "`" + isLive + "`", inline: true },
                            { name: "Verified Since", value: createdSince, inline: true },
                            { name: " ", value: " ", inline: false },
                            { name: "Notable Functions:", value: "```" + notableFunctionsFormatted + "```", inline: false },
                            { name: " ", value: " ", inline: false },
                            { name: "Socials", value: socialsFormatted, inline: true },
                            { name: "Links", value: '[Etherscan](https://etherscan.io/address/' + contract + ") ∙ " + '[Opensea](https://opensea.io/collection/' + contract + ") ∙ " + '[Blur](https://blur.io/collection/' + contract + ") ∙ " + '[Magically](https://magically.gg/collection/' + contract + ") ∙ " + '[Holders](https://blur.io/collection/' + contract + "/holders) ∙ " + '[Deployer](https://etherscan.io/address/' + deployer + ")", inline: false },
                            //{ name: "Quicktasks", value: '[Thunder](http://localhost:7777/quickTask?module=defi&contract=' + contract + "&action=buy&blockchain=ethereum&platform=uniswapv2) ∙ " + '[Maestro]( https://t.me/MaestroSniperBot?start=' + contract + ") ∙ " + '[Sensei](https://app.thornhill.fun/defi?token=' + contract + "&venue=UNISWAP_V2&valueEth=0.05) ∙ " + '[Waifu]( http://localhost:7780/uniswapqt?contractAddress=' + contract + "&group=Default)", inline: false },

                        )
                        .setTimestamp()
                        .setFooter({ text: 'Powered by Rolls Chasers', iconURL: 'https://cdn.discordapp.com/attachments/1108757872315219968/1121978623436521514/rc_logo.png' });

                    
                    await channelNewVerified.send({ embeds: [verifiedERC20] });




                    // // On enregistre les infos du token
                    // const tokenInfos = ercData.filter((contrat) => contrat.dataValues.contractAddress == contract.toLowerCase())

                    // let infoTable = JSON.parse(tokenInfos[0].dataValues.table1)

                    // infoTable[0].proxy = isProxy
                    // infoTable[0].links = socialsFormatted

                    // await erc20.update({
                    //     table1: JSON.stringify(infoTable),
                    //     abi: JSON.stringify(ABI),
                    //     notableFunctions: JSON.stringify(notableAbi),
                    //     sourceCode: sourceCode,
                    //     verified: actualTimestamp,
                    // },
                    //     { where: { contractAddrese: contract.toLowerCase() } })



                }






            } catch (error) {

                console.log("Erreur lors de la récupération des informations, try catch de boucle ")
                console.log(error)


            }
        }

    } catch (error) {

        console.log("Erreur lors de la récupération des informations, try catch global")
        console.log(error)

    }
}



































// //


// // async function hadri(test) {

// //     (async () => {

// //         const browser = await puppeteer.launch({

// //             headless: true,
// //             defaultViewport: {

// //                 width: 1467,
// //                 height: 835

// //             }
// //         })

// //         const page = await browser.newPage()
// //         await page.goto("https://etherscan.io/contractsVerified")

// //         await page.screenshot({ path: "image.png" })


// //         const html = await page.evaluate(() => {
// //             return {

// //                 html: document.documentElement.innerText,
// //                 width: document.documentElement.clientWidth,
// //                 height: document.documentElement.clientHeight


// //             }


// //         })

// // console.log(html)






// //         await browser.close()


// //     })()

// // }

// // hadri()

