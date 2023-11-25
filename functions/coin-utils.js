const { ChainId, TradeContext, UniswapPair, UniswapPairSettings, ETH } = require('simple-uniswap-sdk')
const colors = require("colors")
const BigNumber = require('bignumber.js');
const decrypt = require("./decrypt")

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const infuraApiKey = process.env.infuraApiKey


const Web3 = require('web3')
const web3 = new Web3("https://mainnet.infura.io/v3/" + infuraApiKey)
const chainId = 1

const wETH = "0xbcF9C3e618702Ab4a0D2055687C37A2846019C56"
const wETH_decimals = 18

// On initialise uniswap router V2
const uniswapV2_router2_ABI = require('../contracts/uniswap/router2-v2.json')
const uniswapV2_router2_address = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d"
const routerV2 = new web3.eth.Contract(uniswapV2_router2_ABI, uniswapV2_router2_address);

// On initialise uniswap router V3
const uniswapV3_router_address = "0xe592427a0aece92de3edee1f18e0157c05861564"



async function createFactory(type, tokenOut, sender, slippage) {

    try {

        if (type == "swap_eth_to_token") {


            const uniswapPair = new UniswapPair({
                fromTokenContractAddress: ETH.MAINNET().contractAddress,
                toTokenContractAddress: tokenOut,
                ethereumAddress: sender,
                providerUrl: "https://mainnet.infura.io/v3/" + infuraApiKey,
                chainId: ChainId.MAINNET,
                settings: new UniswapPairSettings({
                    // if not supplied it use `0.005` which is 0.5%;
                    // all figures
                    slippage: parseFloat(slippage / 100).toFixed(3),
                    // if not supplied it will use 20 a deadline minutes
                    deadlineMinutes: 5,
                    disableMultihops: false,
                    gasSettings: {
                        getGasPrice: async () => '35',
                    },
                })
            });

            const uniswapPairFactory = await uniswapPair.createFactory();


            return uniswapPairFactory



        } else if ("swap_token_to_eth") {

            const uniswapPair = new UniswapPair({
                fromTokenContractAddress: tokenOut,
                toTokenContractAddress: ETH.MAINNET().contractAddress,
                ethereumAddress: sender,
                providerUrl: "https://mainnet.infura.io/v3/" + infuraApiKey,
                chainId: ChainId.MAINNET,
                settings: new UniswapPairSettings({
                    // if not supplied it use `0.005` which is 0.5%;
                    // all figures
                    slippage: parseFloat(slippage / 100).toFixed(3),
                    // if not supplied it will use 20 a deadline minutes
                    deadlineMinutes: 5,
                    disableMultihops: false,
                    gasSettings: {
                        getGasPrice: async () => '35',
                    },
                })
            });

            const uniswapPairFactory = await uniswapPair.createFactory();


            return uniswapPairFactory



        }

    } catch (error) {

        console.log(error.stack)

        return null

    }

}



async function generateTrade(type, factory, amountIn) {


    try {

        if (type == "swap_eth_to_token") {

            console.log(colors.blue("Starting Swap ETH to Token..."))



            // On récupère les informations du trade
            const trade = await factory.trade(amountIn);


            // Récupération des infos du trade
            const router_address = trade.transaction.to
            const provided_data = trade.transaction.data
            const provided_sig = trade.transaction.data.substring(0, 10)
            const path = trade.routePath
            const deadline = trade.tradeExpires
            const quote = trade.expectedConvertQuote
            const min_quote = trade.minAmountConvertQuote
            const decimals = trade.toToken.decimals
            const provided_slippage = parseFloat(quote) / parseFloat(min_quote)
            const valueHex = trade.transaction.value
            const value = parseInt(valueHex, 16)
            const balance = trade.fromBalance.balance
            const hasEnough = trade.fromBalance.hasEnough

            let router_tag
            if (router_address.toLowerCase() == uniswapV2_router2_address) { router_tag = "uniswapV2" }
            else if (router_address.toLowerCase() == uniswapV3_router_address) { router_tag = "uniswapV3" }
            else { router_tag = "Unknown" }



            const trade_param = {
                router: router_address,
                name: router_tag,
                sig: provided_sig,
                path: path,
                amountExpected: quote,
                amountOutMin: min_quote,
                value: value,
                decimals: decimals,
                provided_slippage: provided_slippage,
                deadline: deadline,
                data: provided_data,
                balance: balance,
                hasEnough: hasEnough

            }

            trade.destroy()

            return trade_param




        } else if (type == "swap_token_to_eth") {

            console.log(colors.blue("Starting Swap Token to ETH..."))

            const trade = await factory.trade(amountIn);

            // Récupération des infos du trade
            const router_address = trade.transaction.to
            const provided_data = trade.transaction.data
            const provided_sig = trade.transaction.data.substring(0, 10)
            const path = trade.routePath
            const deadline = trade.tradeExpires
            const quote = trade.expectedConvertQuote
            const min_quote = trade.minAmountConvertQuote
            const decimals = trade.fromToken.decimals
            const provided_slippage = parseFloat(quote) / parseFloat(min_quote)
            const valueHex = trade.transaction.value
            const value = parseInt(valueHex, 16)
            const balance = trade.fromBalance.balance
            const hasEnough = trade.fromBalance.hasEnough
            const hasAllowance = trade.hasEnoughAllowance
            const approve_txn = trade.approvalTransaction


            let router_tag
            if (router_address.toLowerCase() == uniswapV2_router2_address) { router_tag = "uniswapV2" }
            else if (router_address.toLowerCase() == uniswapV3_router_address) { router_tag = "uniswapV3" }
            else { router_tag = "Unknown" }



            const trade_param = {
                router: router_address,
                name: router_tag,
                sig: provided_sig,
                path: path,
                amountExpected: quote,
                amountOutMin: min_quote,
                value: value,
                decimals: decimals,
                provided_slippage: provided_slippage,
                deadline: deadline,
                data: provided_data,
                balance: balance,
                hasEnough: hasEnough,
                hasAllowance: hasAllowance,
                approve_txn: approve_txn,

            }
            console.log(trade)
            trade.destroy()

            return trade_param
        }

    } catch (error) {

        console.log(error.stack)

        return null


    }

};



async function encodeSwapExactETHForTokens(param) {

    // Function for Uniswap V2 Router 2 only
    // From ETH to Tokens
    // ETH won't be variable, token can be
    // amountMin is the minimum token expected
    // console.log(param)

    const data = await routerV2.methods.swapExactETHForTokens(
        param.amountMin,
        param.path,
        param.sender,
        param.deadline,
    ).encodeABI();

    return data

}

async function encodeMulticallV3(param) {

    // Function for Uniswap V2 Router 2 only
    // From ETH to Tokens
    // ETH won't be variable, token can be
    // amountMin is the minimum token expected
    // console.log(param)

    const data = await routerV2.methods.swapExactETHForTokens(
        param.amountMin,
        param.path,
        param.sender,
        param.deadline,
    ).encodeABI();

    return data

}


async function simulateTransaction(param) {



    try {

        // On tente de simuler la transaction

        const gas_used = await web3.eth.estimateGas(param)

        return {
            result: gas_used,
            valid: true
        }

    } catch (error) {

        // Gestion de l'erreur en cas de simulation ratée

        let message = error.message

        if (message.startsWith("Returned")) {
            message = message.replace("Returned error: ", "")
        }

        if (message.includes("TRANSFER_FROM_FAILED")) {
            message = "Can't sell tokens, probably a honeypot          "
        }
        console.log(error.stack)

        return {
            result: message,
            valid: false
        }


    }


}

async function signTransaction(txnInfos, private_key) {

    // Sign and send a transaction using PK
    // Triggers the transaction

    try {
        // On signe

        const signedTx = await web3.eth.accounts.signTransaction(txnInfos, private_key);
        const rawTransaction = signedTx.rawTransaction

        // On envoie
        return web3.eth.sendSignedTransaction(rawTransaction)
            .then(async (receipt) => {

                return {
                    hash: receipt.transactionHash,
                    gas_fees: receipt.gasUsed * (receipt.effectiveGasPrice / 10 ** 18),
                    status: receipt.status,
                    message: null
                }

            })
            .catch(async (error) => {

                console.log('Erreur lors de lenvoi de la transaction signée : ', error.stack);

                let message = error.message
                if (message.startsWith("Returned")) {
                    message = message.replace("Returned error: ", "")
                }

                return {
                    hash: null,
                    gas_fees: null,
                    status: null,
                    message: message

                }


            });

    } catch (error) {

        console.log(error.stack)

        return null
    }

}


async function gasOracle(gas_preset, gas_used, max_gwei) {

    const limitHitMargin = 10
    const gasMargin = 1.1

    // On set les gas price
    let gas_price = await web3.eth.getGasPrice()
    let gas_limit = 300000

    // On s'assure que la transaction passe en boostant légèrement les gas
    // On ajoutera ensuite le gas preset
    gas_price = Math.ceil(gas_price * gasMargin)


    if (gas_used && gas_used > gas_limit) {
        gas_limit = Math.ceil(gas_used * (1 + (limitHitMargin / 100)))
    }

    if (gas_preset != null && gas_price) {
        gas_price = parseInt(gas_price * (1 + (parseFloat(gas_preset) / 100)))
    }

    const gas_price_gwei = parseFloat(await web3.utils.fromWei(gas_price.toString(), "gwei"))
    const expected_fees = parseFloat(await web3.utils.fromWei((gas_price * gas_used).toString(), "ether"))

    if (max_gwei == null || gas_price_gwei <= max_gwei) {

        const gasParam = {
            price: gas_price,
            gwei: gas_price_gwei,
            limit: gas_limit,
            fees: expected_fees,
            valid: true
        }

        return gasParam

    } else if (gas_price_gwei > max_gwei) {

        return {
            price: gas_price,
            valid: "Over gas limit"

        }

    } else {

        return null

    }
}


async function gasPreset(gas_preset, max_gwei) {

    const gasMargin = 1.1

    // On set les gas price
    let gas_price = await web3.eth.getGasPrice()
    let gas_limit = 300000

    // On s'assure que la transaction passe en boostant légèrement les gas
    // On ajoutera ensuite le gas preset
    gas_price = Math.ceil(gas_price * gasMargin)

    if (gas_preset != null && gas_price) {
        gas_price = parseInt(gas_price * (1 + (parseFloat(gas_preset) / 100)))
    }

    const gas_price_gwei = parseFloat(await web3.utils.fromWei(gas_price.toString(), "gwei"))

    if (max_gwei == null || gas_price_gwei <= max_gwei) {

        const gasParam = {
            price: gas_price,
            gwei: gas_price_gwei,
            limit: gas_limit,
            valid: true
        }

        return gasParam

    } else if (gas_price_gwei > max_gwei) {

        return {
            price: gas_price,
            valid: "Over gas limit"

        }

    } else {

        return null

    }
}


function quoteToWei(min_quote, decimals) {

    try {

        // Formattage du nombre pour le data parse
        const quoteTokens = BigNumber(min_quote)
        const quoteWei = quoteTokens.multipliedBy(new BigNumber(10).pow(decimals)).decimalPlaces(decimals).toFixed(0)

        return quoteWei

    } catch (error) {
        return null
    }

}

function setSlippage(slippage, amount) {

    let slippageFinal = 0

    if (slippage != null) {

        slippageFinal = parseFloat(slippage)

    } else {

        if (amount <= 0.1) { slippageFinal = 2.5 }
        if (amount <= 0.25 && amount > 0.1) { slippageFinal = 3 }
        if (amount <= 0.5 && amount > 0.25) { slippageFinal = 3.5 }
        if (amount <= 1 && amount > 0.5) { slippageFinal = 4 }
        if (amount > 1) { slippageFinal = 5 }


    }

    return slippageFinal

}




async function priceImpactV2(contract, value, direction) {

    if (direction == "in") {

        const orgTotalToken0 = 2000000
        const orgTotalToken1 = 10000
        const tokenAmount0selling = 10


        const ConstantProduct = orgTotalToken0 * orgTotalToken1

        const orgPrice = orgTotalToken0 / orgTotalToken1

        const token1change = (orgTotalToken1 - (ConstantProduct / (tokenAmount0selling + orgTotalToken0)))

        const PricePaidPerToken1 = tokenAmount0selling / token1change

        const priceDifference = PricePaidPerToken1 - orgPrice

        const intImpact = priceDifference / orgPrice

        const PercentImpact = intImpact * 100

    } else if (direction == "out") {


    } else {
        return null
    }
}


async function approveMaxToken(contract, router, private_key) {

    // Rajouter la vérification du nombre de token approve

    try {

        // Définition de quelques valeurs clés
        const value = "0x00"
        const gas_limit = 50000
        const maxApprove = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
        const gasPrice = await getGasPrice()


        // Ajouter 0x095ea7b3
        const sig = '0x095ea7b3'
        const sigAndAddress = sig + '0'.repeat(24) + router.slice(2);
        const data = sigAndAddress + maxApprove


        if (data.length == 138) {

            // On construit la txn
            const txnInfos = {
                gasLimit: gas_limit,
                gasPrice: gasPrice * 1.2,
                to: contract,
                value: value,
                data: data,
                chainId: chainId,

            };

            // On envoi la txn
            const receipt = await signTransaction(txnInfos, decrypt(private_key))

            if (receipt) {

                return {
                    hash: receipt.transactionHash,
                    status: receipt.status
                }

            } else {

                return null

            }


        } else {

            return null

        }

    } catch (error) {

        console.log(error)

        return false
    }

}


async function balanceOfToken(factory, sender) {

    try {

        const erc20Token = await factory._fromTokenFactory._erc20TokenContract
        const callList = erc20Token.callStatic
        const decimals = factory._uniswapPairFactoryContext.fromToken.decimals

        const balanceCall = await callList.balanceOf(sender)
        const balanceRaw = balanceCall.toString()

        if (parseInt(balanceRaw) > 0) {

            const balance = parseInt(balanceRaw) / 10 ** decimals

            return balance

        } else {
            return 0
        }



    } catch (error) {
        console.log(error.stack)

        return 0

    }
}

async function getAllowance(factory, owner, spender, direction) {

    // Le nombre renvoyé n'est pas formatter
    // Utilisable que pour les comparaison, pas en affichage

    try {

        if (direction == "to_token") {

            const erc20Token = await factory._toTokenFactory._erc20TokenContract
            const callList = erc20Token.callStatic
            const decimals = factory._uniswapPairFactoryContext.toToken.decimals

            const allowance_call = await callList.allowance(owner, spender)
            const allowance_raw = allowance_call.toString()
            console.log(allowance_call)

            if (parseInt(allowance_raw) > 0) {

                const allowance = parseInt(allowance_raw) / 10 ** decimals

                return allowance

            } else {
                return 0
            }

        } else if (direction == "from_token") {

            const erc20Token = await factory._fromTokenFactory._erc20TokenContract
            const callList = erc20Token.callStatic
            const decimals = factory._uniswapPairFactoryContext.fromToken.decimals

            const allowance_call = await callList.allowance(owner, spender)
            const allowance_raw = allowance_call.toString()

            if (parseInt(allowance_raw) > 0) {

                const allowance = parseInt(allowance_raw) / 10 ** decimals

                return allowance.toString()

            } else {
                return 0
            }

        }



    } catch (error) {
        console.log(error.stack)

        return 0

    }

}

async function getGasPrice() {

    const gas_price = await web3.eth.getGasPrice()

    return gas_price

}


function encodeTransfer(receiver, value, decimals) {

    try {

        const sig = "0xa9059cbb"

        // Convertir le nombre flottant en BigNumber
        const valueBN = new BigNumber(parseFloat(value));

        // Multiplier par 10^18 pour obtenir le nombre entier avec la précision des décimales souhaitée
        const valueDecimals = valueBN.times(new BigNumber(10).pow(decimals));


        const input = web3.eth.abi.encodeFunctionCall({
            name: 'transfer',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'to'
            }, {
                type: 'uint256',
                name: 'amount'
            }]
        }, [receiver, valueDecimals]);

        return input

    } catch (error) {

        return null


    }

}

function encodeApproval(spender) {

    const approvalHex = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    const sig = '0x095ea7b3'
    const sigAndAddress = sig + '0'.repeat(24) + spender.slice(2);
    const data = sigAndAddress + approvalHex

    return data

}

function encodeRevoke(spender) {

    const approvalHex = "0000000000000000000000000000000000000000000000000000000000000000"
    const sig = '0x095ea7b3'
    const sigAndAddress = sig + '0'.repeat(24) + spender.slice(2);
    const data = sigAndAddress + approvalHex

    return data

}


module.exports = {
    createFactory,
    generateTrade,
    encodeSwapExactETHForTokens,
    signTransaction,
    gasOracle,
    quoteToWei,
    setSlippage,
    simulateTransaction,
    gasPreset,
    approveMaxToken,
    balanceOfToken,
    getGasPrice,
    getAllowance,
    encodeTransfer,
    encodeApproval,
    encodeRevoke
}