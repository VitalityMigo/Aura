// var Web3 = require("web3")
// const web3CloudflarePublic = new Web3("https://cloudflare-eth.com")

const fs = require("fs").promises

const blurDecoder = require("./1blur-decoder")
const openseaDecoder = require("./1opensea-decoder")
const nftTracker = require("./1m-nfttrack")
const nftSmartmoney = require("./1m-nftsmartmoney")


// Marketplace NFT
const blurV3_address = "0xb2ecfe4e4d61f8790bbb9de2d1259b9e2410cea5"
const seaport15_address = "0x00000000000000adc04c56bf30ac9d3c0aaf14dc"

const smartmoneyRaw = require("../contracts/nft/smartmoney.json")
const smartmoney = smartmoneyRaw.map((item) => item.address.toLowerCase());
const tracker = "contracts/nft/tracker.json"

async function nftMonitors(transaction) {

    // const transaction = await web3CloudflarePublic.eth.getTransaction(hash)

    // On identifie la marketplace et decode les params en fonctions
    let data
    const marketplace = transaction.to.toLowerCase()
    if (marketplace === blurV3_address) { data = blurDecoder(transaction) }
    else if (marketplace === seaport15_address) { data = openseaDecoder(transaction) }

    if (data != null) {

        // On update la liste JSON de wallet track
        const rawTargets = await fs.readFile(tracker, 'utf8');
        const fullTargets = JSON.parse(rawTargets)
        const targets = fullTargets.map((item) => item.address.toLowerCase());

        const traders = data.traders

        const isTarget = traders.filter(adresse => targets.includes(adresse));
        const isSmartmoney = traders.filter(adresse => smartmoney.includes(adresse));

        // On renvoi vers les addresses track
        if (isTarget.length > 0) {

            nftTracker(data, isTarget)

        }


        // On renvoi vers les addresses smart money
        if (isSmartmoney.length > 0) {
            nftSmartmoney(data, isSmartmoney)

        }







    }




}

module.exports = nftMonitors