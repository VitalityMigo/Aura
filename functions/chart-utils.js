// On récupère le node
const { web3CloudflarePublic } = require("../config/web3config");

// On crée quelques fonctions utiles
async function decodeUniswapSwapEvent(version, input, topics, block, toBlock, contract, wETH, decimals, timestamp, ethprice) {

    if (version == "v2") {
        // On définit les valeurs finales
        let action
        let eth
        let token
        let from
        let price

        const ethprice = 2000

        // On isole les valeurs qui nous importent
        const input2 = input.slice(2)
        const amount0In = parseInt(input2.substring(0, 64), 16)
        const amount1In = parseInt(input2.substring(64, 128), 16)
        const amount0Out = parseInt(input2.substring(128, 192), 16)
        const amount1Out = parseInt(input2.substring(192, 256), 16)

        const sender = topics[1]
        const to = topics[2]

        // On définit lequel est A et lequel est B
        const a1 = contract.toLowerCase();
        const a2 = wETH.toLowerCase();
        const token0 = a1 < a2 ? contract : wETH;
        const token1 = a1 < a2 ? wETH : contract;


        //Calcul du timestamp a retravailler ! 

        const time = blockFromBlock(block, toBlock, timestamp)


        // // GET CODE POUR TAG (Est ce que c'est un bot ?)
        // const code = await web3.eth.getCode(sender);
        // let tag = ""
        // if (code != "0x") { tag = "🤖" }

        // Le 0 est le token
        if (token0.toLowerCase() == a1) {

            // Il n'y a pas de token qui rentre ni de wETH qui sort
            if (amount0In <= 0 && amount1Out <= 0) {

                action = "buy"
                eth = amount1In / 10 ** 18
                token = amount0Out / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "sell"
                eth = amount1Out / 10 ** 18
                token = amount0In / 10 ** decimals
                from = "0x" + sender.substring(26, 66)
                price = (eth / token) * ethprice


            }


        } else {
            // Le 1 est le token

            // Il n'y a pas de token qui rentre ni de wETH qui sort
            if (amount0In <= 0 && amount1Out <= 0) {

                action = "sell"
                eth = amount0Out / 10 ** 18
                token = amount1In / 10 ** decimals
                from = "0x" + sender.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "buy"
                eth = amount0In / 10 ** 18
                token = amount1Out / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice


            }

        }

        const result = {
            action: action,
            eth: eth,
            coin: token,
            sender: from,
            timestamp: time,
            price: price
        }

        return result

    } else {


        // On définit les valeurs finales
        let action
        let eth
        let token
        let from
        let price

        const logs = decodeRawLogsUniswapV3(input, topics)

        const amount0 = logs.amount0
        const amount1 = logs.amount1

        const sender = topics[1]
        const to = topics[2]

        // On définit lequel est A et lequel est B
        const a1 = contract.toLowerCase();
        const a2 = wETH.toLowerCase();
        const token0 = a1 < a2 ? contract : wETH;
        const token1 = a1 < a2 ? wETH : contract;


        //Calcul du timestamp a retravailler ! 

        const time = blockFromBlock(block, toBlock, timestamp)

        if (token0.toLowerCase() == a1) {

            // Il n'y a pas de token qui rentre ni de wETH qui sort
            if (amount0 < 0 && amount1 > 0) {

                action = "buy"
                eth = parseFloat(Math.abs(amount1) / 10 ** 18).toFixed(5)
                token = Math.abs(amount0) / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "sell"
                eth = parseFloat(Math.abs(amount1) / 10 ** 18).toFixed(5)
                token = Math.abs(amount0) / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            }


        } else {
            // Le 1 est le token

            if (amount0 < 0 && amount1 > 0) {

                action = "sell"
                eth = parseFloat(Math.abs(amount0) / 10 ** 18).toFixed(5)
                token = Math.abs(amount1) / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            } else {

                // Il n'y a pas de wETH qui rentre ni de token qui sort

                action = "buy"
                eth = parseFloat(Math.abs(amount0) / 10 ** 18).toFixed(5)
                token = Math.abs(amount1) / 10 ** decimals
                from = "0x" + to.substring(26, 66)
                price = (eth / token) * ethprice

            }
        }

        return {
            action: action,
            eth: parseFloat(eth),
            coin: token,
            sender: from,
            timestamp: time,
            price: price
        }

    }

}


function blockFromBlock(targetBlock, currentBlock, currentTimestamp) {
    const averageBlockTime = 12

    // Calculer la différence de blocs entre le bloc actuel et le bloc cible
    const blockDifference = targetBlock - currentBlock;

    // Calculer le temps écoulé en secondes
    const timeElapsed = blockDifference * averageBlockTime;

    // Estimer le timestamp du bloc cible
    const estimatedTimestamp = currentTimestamp + timeElapsed;

    return estimatedTimestamp;
}

function groupByPeriod(swaps, numBars) {
    const chart = [];

    // Triez les ventes par timestamp
    swaps.sort((a, b) => a.timestamp - b.timestamp);

    // Calculez le gap total entre la première et la dernière vente
    const totalTimestampGap = swaps[swaps.length - 1].timestamp - swaps[0].timestamp;

    // Calculez la taille de chaque barre en termes de timestamp
    const barTimestampSize = totalTimestampGap / numBars;

    // On instancie les stats générales
    let firstTime = swaps[0].timestamp
    let lastTime = swaps[swaps.length - 1].timestamp
    let lowest = 0
    let highest = 0


    // Initialisez les compteurs
    let currentBarIndex = 0;
    let currentBarSales = 0;
    let currentBarVolume = 0;
    let currentBarTimestamp = swaps[0].timestamp;

    let entry = 0
    let exit = 0
    let low = 0
    let high = 0
    let buy = true

    let origin = 0
    let end = 0


    // Parcourez les ventes pour créer les barres de volume
    for (const swap of swaps) {
        while (swap.timestamp >= currentBarTimestamp + barTimestampSize) {

            // On met le dernier timestamp 
            end = swap.timestamp

            // On définit si c'est un buy ou sell
            if (entry > exit) { buy = false }

            // Créez un objet représentant la barre actuelle
            chart.push({
                index: currentBarIndex,
                data: {
                    swaps: currentBarSales,
                    volume: currentBarVolume,
                },
                bars: {
                    low: low,
                    high: high,
                    entry: entry,
                    exit: exit,
                    buy: buy,
                },
                time: {
                    start: origin,
                    end: end,
                    timelapse: barTimestampSize
                }


            });

            // Réinitialisez les compteurs pour la prochaine barre
            currentBarIndex++;
            currentBarSales = 0;
            currentBarVolume = 0;
            currentBarTimestamp += barTimestampSize;
            high = 0
            low = 0
            buy = true

            // La première est l'entry
            entry = swap.price
            origin = swap.timestamp

        }

        // Mettez à jour les compteurs pour la vente actuelle
        currentBarSales++;
        currentBarVolume += swap.eth;

        // L'exit est le dernier
        exit = swap.price

        // On incrémente aussi low et high qu'on modifiera
        if (swap.price > high) { high = swap.price }
        if (swap.price < low || low === 0) { low = swap.price }

        // On incrémente les datas générales
        if (swap.price > highest) { highest = swap.price }
        if (swap.price < lowest || lowest === 0) { lowest = swap.price }

    }

    const result = {
        global: {
            earliest: firstTime,
            latest: lastTime,
            lowest: lowest,
            highest: highest
        },
        chart: chart
    }

    return result;
}

function convertSecondsToTime(seconds) {
    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInWeek = 604800;
    const secondsInMonth = 2592000;

    if (seconds < secondsInMinute) {
        return seconds + "s";
    } else if (seconds < secondsInHour) {
        const minutes = Math.round(seconds / secondsInMinute);
        return minutes + "m";
    } else if (seconds < secondsInDay) {
        const hours = Math.round(seconds / secondsInHour);
        return hours + "h";
    } else if (seconds < secondsInWeek) {
        const days = Math.round(seconds / secondsInDay);
        return days + "d";
    } else if (seconds < secondsInMonth) {
        const weeks = Math.round(seconds / secondsInWeek);
        return weeks + "w";
    } else {
        const months = Math.round(seconds / secondsInMonth);
        return months + "M";
    }
}


function timeScale(frameSZ, originTime, frameTime) {

    // On met les valeurs de base
    const initialSpace = 146
    const space = 158
    const places = 7
    const littleGap = 11

    const timePerCm = frameTime / frameSZ
    const firstTime = originTime - (littleGap * timePerCm)

    const result = []

    for (let index = 0; index < places; index++) {

        let gap = firstTime + (((index) * space) * timePerCm)

        result.push(gap)

    }

    return result
}

function formatTimestamps(timestamps, firstSale, lastSale) {

    const timeDiff = lastSale - firstSale;
    const oneHour = 3600; // en secondes
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    const firstTimestamp = timestamps[0];
    const lastTimestamp = timestamps[timestamps.length - 1];

    // On définit les timestamp variable
    let secondTimestamp = 0
    let currentDate = new Date(firstTimestamp * 1000);


    const formattedTimestamps = timestamps.map((timestamp, index) => {
        const date = new Date(timestamp * 1000); // convertir en millisecondes

        if (timeDiff <= oneDay * 2) {
            // Option 1: moins de 24 heures
            if (index === 0) {
                // C'est le premier timestamp
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            } else {
                if ((date.getDate() === new Date(firstTimestamp * 1000).getDate() && date.getMonth() === new Date(firstTimestamp * 1000).getMonth())
                    || (date.getDate() === new Date(secondTimestamp * 1000).getDate() && date.getMonth() === new Date(secondTimestamp * 1000).getMonth())) {
                    // Même jour que le premier timestamp
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Autre jour
                    secondTimestamp = timestamp
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
            }
        } else if (timeDiff <= oneWeek) {
            // Option 2: Entre 1 et 7 jours
            const isSameDay = date.getDate() === currentDate.getDate();
            const isSameMonth = date.getMonth() === currentDate.getMonth();


            if (index === 0) {
                return ' '
            } else {

                if (isSameDay && isSameMonth && timeDiff > oneDay) {
                    // Répétition du jour, afficher heures/minutes
                    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
                } else {
                    // Nouveau jour, afficher mois/jour
                    currentDate = new Date(timestamp * 1000);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

            }
        } else {
            // Option 3: Plus de 7 jours
            if (index === 0) {
                return ' '
            } else {

                // Nouveau jour, afficher jour/mois
                return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            }
        }
    });
    return formattedTimestamps;
}

function priceScale(priceOnCanvas, maxSaleLocation, maxSale) {

    // On définit les valeurs de base
    const places = 6
    const space = 88.5

    // On calcul le nombre de CM de différence entre la vente
    // max et la première échelle (initialGap)
    const firstLadder = 146
    const initialGap = firstLadder - maxSaleLocation

    // On calcul le nombre d'ETH dans un centimètre
    // en utilisant le priceOnCanvas (CM par ETH).
    // Puis on calcul le prix en ETH du premier gap
    const ethPerCm = 1 / priceOnCanvas

    const result = []

    for (let index = 0; index < places; index++) {

        const gap = maxSale - (initialGap + (index * space)) * ethPerCm;

        result.push(gap)

    }

    return result
}

function priceIndice(price) {

    if (price > 0.01) {

        return parseFloat(price).toFixed(3)

    } else if (price > 0.001) {

        return parseFloat(price).toFixed(3)

    } else {

        const indices = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₁₀', '₁₁', '₁₂', '₁₃', '₁₄', '₁₅', '₁₆', '₁₇', '₁₈', '₁₉'];
        const decimal = price.toString().split(".")[1]

        let count = 0
        for (const char of decimal) {
            if (char == "0") {
                count++
            } else {
                break
            }
        }


        const indice = indices[count]
        const firstNoZero = count
        const extra = decimal.substring(firstNoZero, firstNoZero + 2)

        return "0.0" + indice + extra

    }

}

function decodeRawLogsUniswapV3(data, topics) {

    // Events
    const typeUniswapV3SwapEvent = [
        { type: 'int256', name: 'amount0' },
        { type: 'int256', name: 'amount1' },
        { type: 'uint160', name: 'sqrtPriceX96' },
        { type: 'uint128', name: 'liquidity' },
        { type: 'int24', name: 'tick' }
    ];

    const decoded = web3CloudflarePublic.eth.abi.decodeLog(
        typeUniswapV3SwapEvent,
        data,
        topics
    );

    return decoded

}


async function fetchLogsBatch(fromBlock, toBlock, pair, topic, batch, repetition) {
    const promises = [];

    for (let index = 0; index < repetition; index++) {
        const filter = {
            address: pair,
            topics: [topic],
            fromBlock: fromBlock,
            toBlock: toBlock,
        };

        promises.push(
            web3CloudflarePublic.eth.getPastLogs(filter).catch(error => {
                console.error(error.stack);
                return []; // Retourne un tableau vide en cas d'erreur
            })
        );

        // Mise à jour des valeurs clés
        fromBlock -= batch;
        toBlock -= 800;
    }

    const results = await Promise.all(promises);
    const logsList = results.flat();

    return logsList;
}



module.exports = {
    groupByPeriod,
    convertSecondsToTime,
    timeScale,
    decodeUniswapSwapEvent,
    formatTimestamps,
    priceScale,
    priceIndice,
    fetchLogsBatch,
}