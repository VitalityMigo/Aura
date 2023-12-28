const { web3CloudflarePublic } = require("../config/web3config")
const erc721Standard = require("../contracts/blur/erc721standard.json")
const erc20Standard = require("../contracts/uniswap/erc20standart.json")

async function identifyContract(txn) {
    let state = "???"

    
    const tokenContract = new web3CloudflarePublic.eth.Contract([...erc20Standard, ...erc721Standard], txn);

    try {
        await tokenContract.methods.decimals().call();
        state = "ERC20";
    } catch (error) {
        try {
            await tokenContract.methods.ownerOf("1").call();
            state = "ERC721";
        } catch (error) {
            state = "Other";
        }
    }

    return state;
}

async function contractType(contractAddress) {

    try {
        const type = await identifyContract(contractAddress);

        return type
    } catch (error) {
        console.error("Error:", error);

        let errorMessage = 'N/A'
return errorMessage
    }
}


module.exports = contractType;


