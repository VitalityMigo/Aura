//Web3 API + Cloudfare Provider
const { web3CloudflarePublic } = require("../config/web3config")


const { getToken } = require('./coin-utils')


const pairABI = require("../contracts/uniswap/pair.json")
const quotes = require("../contracts/uniswap/quote.json")


const swapUniV2 = "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822"
const swapUniV3 = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67"
const swapTopicsArray = [swapUniV2, swapUniV3]


const typeUniswapV3SwapEvent = [
    { type: 'int256', name: 'amount0' },
    { type: 'int256', name: 'amount1' },
    { type: 'uint160', name: 'sqrtPriceX96' },
    { type: 'uint128', name: 'liquidity' },
    { type: 'int24', name: 'tick' }
];






async function uniswapDecoder(swapLogs) {

    const swapCount = swapLogs.length

    //const swapA = 
    if (swapCount == 1) {

        const topics = swapLogs[0].topics[0]
        const dataRaw = swapLogs[0].data
        const data = dataRaw.slice(2)
        const pairAddress = swapLogs[0].address



        const pairContract = new web3CloudflarePublic.eth.Contract(pairABI, pairAddress);

        const token0 = await pairContract.methods.token0().call()
        const token1 = await pairContract.methods.token1().call()

        // On met le token quote et le token qui est trade
        let tokenAddress = token0.toLowerCase()
        let tokenId = "token0"
        let quoteAddress = token1.toLowerCase()
        let quoteId = "token1"
        const isQuote = quotes.some(item => item.contract === token0.toLowerCase());
        if (isQuote) { tokenAddress = token1; quoteAddress = token0; tokenId = "token1"; quoteId = "token0" }

        const tokens = await getToken([tokenAddress, quoteAddress])

        // On construit les deux objets token et quote
        const token = {
            name: tokens[0].name,
            symbol: tokens[0].symbol,
            address: tokenAddress,
            decimals: tokens[0].decimals,
            tokenId: tokenId
        }

        const quote = {
            name: tokens[1].name,
            symbol: tokens[1].symbol,
            address: quoteAddress,
            decimals: tokens[1].decimals,
            tokenId: quoteId
        }

        // A ce moment là on a les datas et deux objets
        // Le premier tableau avec le token
        // Le deuxième objet avec le quote (wETH, wBTC, USDC etc...)
        // On a plus qu'à interprété les datas en fonction de la Version d'Uniswap
        // Pour cela on crée un objet avec les data déjà légèrement traité, du moins séparé

        if (topics == swapUniV2) {

            const dataForm = {
                amount0In: parseInt(data.substring(0, 64), 16),
                amount1In: parseInt(data.substring(64, 128), 16),
                amount0Out: parseInt(data.substring(128, 192), 16),
                amount1Out: parseInt(data.substring(192, 256), 16)
            }

            const decodedData = decodeUniswapV2SwapEvent(token, quote, dataForm)

            let swapTokenIn = quote
            let swapTokenOut = token
            if (decodedData.action == "sell") { swapTokenIn = token; swapTokenOut = quote }

            const target = {
                symbol: token.symbol,
                address: token.address
            }

            const decodedSwap = {
                action: decodedData.action,
                target: target,
                tokenIn: swapTokenIn,
                tokenOut: swapTokenOut
            }

            return decodedSwap

        } else if (topics == swapUniV3) {

            const decodedParams = web3CloudflarePublic.eth.abi.decodeLog(typeUniswapV3SwapEvent, data);

            const dataForm = {
                amount0: parseInt(decodedParams.amount0),
                amount1: parseInt(decodedParams.amount1),
            }

            const decodedSwap = decodeUniswapV3SwapEvent(token, quote, dataForm)

            const target = {
                symbol: token.symbol,
                address: token.address
            }

            decodedSwap.target = target

            return decodedSwap

        }

    } else if (swapCount > 1) {


        // On formatte assez longuement
        // Le but est de comprendre lequel est le token0 et token1
        // Mais aussi de récupérer les infos de ces tokens
        // On ressort avec différentes infos qu'on utiliseras plus tard

        const topicA = swapLogs[0].topics[0]
        const dataRawA = swapLogs[0].data
        const dataA = dataRawA.slice(2)
        const pairAddressA = swapLogs[0].address

        const pairContractA = new web3CloudflarePublic.eth.Contract(pairABI, pairAddressA);

        const token0A = await pairContractA.methods.token0().call()
        const token1A = await pairContractA.methods.token1().call()

        // On séléctionne les bonne data
        let swapTokenIn
        if (topicA == swapUniV2) {

            const dataFormA = {
                amount0In: parseInt(dataA.substring(0, 64), 16),
                amount1In: parseInt(dataA.substring(64, 128), 16),
                amount0Out: parseInt(dataA.substring(128, 192), 16),
                amount1Out: parseInt(dataA.substring(192, 256), 16)
            }
            swapTokenIn = await decodeUniswapV2MultiswapEvent("in", token0A, token1A, dataFormA)

        } else if (topicA == swapUniV3) {
            const decodedParams = web3CloudflarePublic.eth.abi.decodeLog(typeUniswapV3SwapEvent, dataA);
            const dataFormA = {
                amount0: parseInt(decodedParams.amount0),
                amount1: parseInt(decodedParams.amount1),
            }
            swapTokenIn = await decodeUniswapV3MultiswapEvent("in", token0A, token1A, dataFormA)

        }


        const topicB = swapLogs[swapCount - 1].topics[0]
        const dataRawB = swapLogs[swapCount - 1].data
        const dataAB = dataRawB.slice(2)
        const pairAddressB = swapLogs[swapCount - 1].address

        const pairContractB = new web3CloudflarePublic.eth.Contract(pairABI, pairAddressB);

        const token0B = await pairContractB.methods.token0().call()
        const token1B = await pairContractB.methods.token1().call()



        let swapTokenOut
        // On séléctionne les bonne data
        if (topicB == swapUniV2) {

            const dataFormB = {
                amount0In: parseInt(dataAB.substring(0, 64), 16),
                amount1In: parseInt(dataAB.substring(64, 128), 16),
                amount0Out: parseInt(dataAB.substring(128, 192), 16),
                amount1Out: parseInt(dataAB.substring(192, 256), 16)
            }

            swapTokenOut = await decodeUniswapV2MultiswapEvent("out", token0B, token1B, dataFormB)

        } else if (topicB == swapUniV3) {

            const decodedParams = web3CloudflarePublic.eth.abi.decodeLog(typeUniswapV3SwapEvent, dataAB);

            const dataFormB = {
                amount0: parseInt(decodedParams.amount0),
                amount1: parseInt(decodedParams.amount1),
            }


            swapTokenOut = await decodeUniswapV3MultiswapEvent("out", token0B, token1B, dataFormB)

        }




        let action = "buy"
        let target_symbol = swapTokenOut.symbol
        let target_address = swapTokenOut.address
        const isInside = quotes.some(item => item.contract === swapTokenOut.address.toLowerCase());
        if (isInside) { action = 'sell'; target_symbol = swapTokenIn.symbol; target_address = swapTokenIn.address }

        const target = {
            symbol: target_symbol,
            address: target_address,
        }


        const decodedSwap = {
            action: action,
            target: target,
            tokenIn: swapTokenIn,
            tokenOut: swapTokenOut

        }

        return decodedSwap


    }


}

//uniswapDecoder("0x8fc4fad457cc3f684b7d647720d3fc35cd304d1b7cefd682990d2c779bd7658f")

module.exports = uniswapDecoder




function decodeUniswapV2SwapEvent(token, quote, dataForm) {

    const amount0In = dataForm.amount0In
    const amount1In = dataForm.amount1In
    const amount0Out = dataForm.amount0Out
    const amount1Out = dataForm.amount1Out

    const ethprice = 2000


    // Le 0 est le token
    if (token.tokenId == "token0") {

        if (amount0In <= 0 && amount1Out <= 0) {
            // Il n'y a pas de token qui rentre ni de wETH qui sort

            const tokenIn = quote
            tokenIn.amount = amount1In / 10 ** quote.decimals

            const tokenOut = token
            tokenOut.amount = amount0Out / 10 ** token.decimals

            return {
                action: "buy",
                tokenIn: tokenIn,
                token: tokenOut,
            }



        } else {
            // Il n'y a pas de wETH qui rentre ni de token qui sort

            const tokenIn = token
            tokenIn.amount = amount0In / 10 ** token.decimals

            const tokenOut = quote
            tokenOut.amount = amount1Out / 10 ** quote.decimals

            return {
                action: "sell",
                tokenIn: tokenIn,
                token: tokenOut,
            }
        }


    } else {
        // Le 1 est le token

        // Il n'y a pas de token qui rentre ni de wETH qui sort
        if (amount0In <= 0 && amount1Out <= 0) {

            const tokenIn = token
            tokenIn.amount = amount1In / 10 ** token.decimals

            const tokenOut = quote
            tokenOut.amount = amount0Out / 10 ** quote.decimals


            return {
                action: "sell",
                tokenIn: tokenIn,
                tokenOut: tokenOut,
            }


        } else {

            // Il n'y a pas de wETH qui rentre ni de token qui sort
            const tokenIn = quote
            tokenIn.amount = amount0In / 10 ** quote.decimals

            const tokenOut = token
            tokenOut.amount = amount1Out / 10 ** token.decimals

            return {
                action: "buy",
                tokenIn: tokenIn,
                tokenOut: tokenOut,
            }


        }

    }


}


function decodeUniswapV3SwapEvent(token, quote, dataForm) {

    // La particularité des pools V3 est que le signe est par rapport à la pool
    // Si un des amount est négatif cela veut dire que la pool a perdu de ces tokens
    // Si c'est positif, la pool en a gagné 

    // const ethprice = 2000

    const amount0 = dataForm.amount0
    const amount1 = dataForm.amount1


    // Le 0 est le token
    if (token.tokenId == "token0") {


        // Il n'y a pas de token qui rentre ni de wETH qui sort

        let action = "buy"
        let tokenIn = quote
        tokenIn.amount = Math.abs(amount1) / 10 ** quote.decimals
        let tokenOut = token
        tokenOut.amount = Math.abs(amount0) / 10 ** token.decimals
        if (amount1 < 0) {
            action = "sell"
            tokenIn = token
            tokenIn.amount = Math.abs(amount0) / 10 ** token.decimals
            tokenOut = quote
            tokenOut.amount = Math.abs(amount1) / 10 ** quote.decimals
        }


        return {
            action: action,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
        }


    } else {
        // Le 1 est le token

        let action = "buy"
        let tokenIn = quote
        tokenIn.amount = Math.abs(amount0) / 10 ** quote.decimals
        let tokenOut = token
        tokenOut.amount = Math.abs(amount1) / 10 ** token.decimals

        // On modifie tout y compris les amount
        if (amount0 < 0) {
            action = "sell"
            tokenIn = token
            tokenIn.amount = Math.abs(amount1) / 10 ** token.decimals
            tokenOut = quote
            tokenOut.amount = Math.abs(amount0) / 10 ** quote.decimals

        }

        // Il n'y a pas de token qui rentre ni de wETH qui sort

        return {
            action: action,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
        }

    }

}

async function decodeUniswapV2MultiswapEvent(direction, token0A, token1A, dataFormA) {

    if (direction == "in") {

        // On commence par le token In
        // Token out plus loin
        const amount0In = dataFormA.amount0In
        const amount1In = dataFormA.amount1In

        let tokenIn
        if (amount0In > 0 && amount1In === 0) {

            const tokens = await getToken([token0A])


            tokenIn = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: amount0In / 10 ** tokens[0].decimals
            }


        } else if (amount1In > 0 && amount0In === 0) {

            const tokens = await getToken([token1A])


            tokenIn = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: amount1In / 10 ** tokens[0].decimals
            }

        }


        return tokenIn


    } else if (direction == "out") {


        // On commence par le token In
        // Token out plus loin
        const amount0Out = dataFormA.amount0Out
        const amount1Out = dataFormA.amount1Out


        let tokenOut
        if (amount0Out > 0 && amount1Out === 0) {

            const tokens = await getToken([token0A])


            tokenOut = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: amount0Out / 10 ** tokens[0].decimals
            }


        } else if (amount1Out > 0 && amount0Out === 0) {

            const tokens = await getToken([token1A])


            tokenOut = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: amount1Out / 10 ** tokens[0].decimals
            }

        }


        return tokenOut


    }

}


async function decodeUniswapV3MultiswapEvent(direction, token0A, token1A, dataFormA) {


    if (direction == "in") {

        // On commence par le token In
        // Token out plus loin
        const amount0 = dataFormA.amount0
        const amount1 = dataFormA.amount1



        let tokenIn
        if (amount0 > 0 && amount1 < 0) {

            const tokens = await getToken([token0A])


            tokenIn = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: Math.abs(amount0) / 10 ** tokens[0].decimals
            }


        } else if (amount1 > 0 && amount0 < 0) {

            const tokens = await getToken([token1A])


            tokenIn = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: Math.abs(amount1) / 10 ** tokens[0].decimals
            }

        }


        return tokenIn


    } else if (direction == "out") {


        // On commence par le token In
        // Token out plus loin
        const amount0 = dataFormA.amount0
        const amount1 = dataFormA.amount1


        let tokenOut
        if (amount0 > 0 && amount1 < 0) {

            const tokens = await getToken([token1A])


            tokenOut = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: Math.abs(amount1) / 10 ** tokens[0].decimals
            }


        } else if (amount1 > 0 && amount0 < 0) {

            const tokens = await getToken([token0A])


            tokenOut = {
                name: tokens[0].name,
                symbol: tokens[0].symbol,
                address: tokens[0].contractAddress,
                decimals: tokens[0].decimals,
                amount: Math.abs(amount0) / 10 ** tokens[0].decimals
            }

        }


        return tokenOut


    }

}
