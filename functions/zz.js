

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`https://1rpc.io/base`))


const shareContractAbi = require("../contracts/friendtech/share.json")
const shareContractAddress = "0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4"
const shareContract = new web3.eth.Contract(shareContractAbi, shareContractAddress);

async function kek(test) {
    
    const subject = "0x87F9Ee054Dfcbfe0d459143A52Af81652e94173D"
    const sender = "0xfd7232e66a69e1ae01e1e0ea8fab4776e2d325a9"
    const amount = 2

    const price = 0.021
    const priceToPay = price * amount

    const valueETH = priceToPay * (1 + ((5 + 5) / 100))

    const valueWEI = web3.utils.toWei(valueETH.toString(), 'ether');

    const gasUsed = await shareContract.methods.buyShares(subject, amount).estimateGas({ from: sender.toLowerCase(), value: valueWEI });

    console.log(gasUsed)


}


kek("e")