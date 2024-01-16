const { PublicKey } = require('@solana/web3.js');
const { sol } = require("../config/web3config")
const axios = require('axios')

async function getMetrics(contract) {


    try {

        const call = await axios.get("https://api.dexscreener.io/latest/dex/tokens/" + contract)

        if (call.data.pairs.length > 0) {

            const object = call.data.pairs[0]

            const metrics = {
                priceUSD: parseFloat(object.priceUsd),
                priceSOL: parseFloat(object.priceNative),
                token: object.baseToken,
                quote: object.quoteToken,
                pool: object.pairAddress,
                dex: object.dexId
            }
            return metrics

        } else {

            const metrics = {
                priceUSD: 0,
                priceETH: 0,
                token: null,
                quote: null,
                pool: null,
                dex: null,
            }

            return metrics
        }
    } catch (error) {

        const metrics = {
            priceUSD: 0,
            priceETH: 0,
            token: null,
            quote: null,
            pool: null,
            dex: null,
        }

        return metrics
    }

}

async function getTokenBalance(address) {
    const accountInfo = await sol.getTokenAccountBalance(address);
    if (accountInfo) {
        const balance = accountInfo.value.uiAmount
        return balance;
    } else {
        return 0;
    }
}

async function getSupply(contract) {
    const tokenMintPublicKey = new PublicKey(contract);
    const token = await sol.getTokenSupply(tokenMintPublicKey);
    if (token) {
        const supply = token.value.uiAmount
        return supply;
    } else {
        return 0;
    }
}

async function getSolPrice() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const solPrice = response.data.solana.usd;
        return solPrice;
    } catch (error) {
        console.error('Error fetching SOL price:', error);
        return null;
    }
}

async function getTokenAccountAddress(tokenMint, address) {
    try {

        // Convertissez l'adresse du portefeuille en PublicKey
        const ownerPublicKey = new PublicKey(address);

        // Obtenez la liste des comptes de jetons détenus par le propriétaire
        const tokenAccounts = await sol.getParsedTokenAccountsByOwner(
            ownerPublicKey,
            { mint: new PublicKey(tokenMint) },
            'confirmed'
        );

        // Vérifiez s'il existe des comptes de jetons
        if (tokenAccounts.value.length > 0) {
            // L'adresse du compte de jeton est dans la propriété pubkey du premier élément
            const tokenAccountAddress = tokenAccounts.value[0].pubkey

            const result = {
                public: tokenAccountAddress.toBase58(),
                raw: tokenAccountAddress,
            }
            return result;
        } else {
            return null;
        }
    } catch (error) {
        console.log(error.stack);
        return null;
    }
}

async function getTransactionHistory(address) {

    try {

        const txn = await sol.getConfirmedSignaturesForAddress2(address);

        return txn

    } catch (error) {
        console.log(error.stack)
        return null
    }
}


function findWalletIndexInAccounts(transaction, wallet) {

    const accounts = transaction.transaction.message.accountKeys

    for (let i = 0; i < accounts.length; i++) {
        const currentPubKey = accounts[i].pubkey.toBase58(); // Convertir PublicKey en chaîne
        if (currentPubKey === wallet) {
            return i; // Retourner l'index si la clé est trouvée
        }
    }
    return -1; // Retourner -1 si la clé n'est pas trouvée
}

function isValidSolanaAddress(address) {
    try {
        // Essayez de créer un objet PublicKey à partir de la chaîne d'adresse
        const publicKey = new PublicKey(address);
        // Si la création réussit, l'adresse est valide
        if (publicKey) {
            return true;
        } else {
            return false
        }
    } catch (error) {
        // Si une erreur se produit lors de la création, l'adresse n'est pas valide
        return false;
    }
}


module.exports = {
    getMetrics,
    getTokenBalance,
    getSupply,
    getSolPrice,
    getTokenAccountAddress,
    getTransactionHistory,
    findWalletIndexInAccounts,
    isValidSolanaAddress
}