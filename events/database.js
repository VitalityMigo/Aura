const { Sequelize, Op } = require('@sequelize/core');

//initialisation de la db
const sequelize = new Sequelize('rcadatabase', 'rollschasersanalytics', 'Elvprs1997!', {
    dialect: 'sqlite',
    storage: './../data/rcadatabase.sqlite'
});


//Access
const accessSql = sequelize.define('access', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    serverId: {
        type: Sequelize.STRING,
    },
    serverName: {
        type: Sequelize.STRING,
    },
    accessTier: {
        type: Sequelize.TEXT,
    },
    adminRoleId: {
        type: Sequelize.TEXT,
    },
    memberRoleId: {
        type: Sequelize.TEXT,
    },
    updateChannel: {
        type: Sequelize.STRING,
    },
    adminUpdateChannel: {
        type: Sequelize.STRING,
    },
    userCount: {
        type: Sequelize.STRING,
    },
    accessSince: {
        type: Sequelize.STRING,
    },
    adminWalletAddress: {
        type: Sequelize.STRING,
    },
    subscribtionStatut: {
        type: Sequelize.STRING,
    },
    subscribtionPrice: {
        type: Sequelize.STRING,
    },
    password: {
        type: Sequelize.STRING,
    },
    actualPower: {
        type: Sequelize.STRING,
    },
    statut: {
        type: Sequelize.STRING,
    },
    contact: {
        type: Sequelize.STRING,
    },
});




//Interactions
const interactionData = sequelize.define('interaction', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    authorName: {
        type: Sequelize.STRING,
    },
    commandName: {
        type: Sequelize.TEXT,
    },
    serverId: {
        type: Sequelize.STRING,
    },
    interactionId: {
        type: Sequelize.TEXT,
    },
    walletName: {
        type: Sequelize.STRING,
    },
    walletAddress: {
        type: Sequelize.STRING,
    },
    walletCategory: {
        type: Sequelize.STRING,
    },
    embed1: {
        type: Sequelize.TEXT,
    },
    embed2: {
        type: Sequelize.TEXT,
    },
    embed3: {
        type: Sequelize.TEXT,
    },
    selecedTimestamp: {
        type: Sequelize.STRING,
    },
    pageIndex: {
        type: Sequelize.STRING,
    },
    actualPage: {
        type: Sequelize.STRING,
    },
    selectedCollection: {
        type: Sequelize.STRING,
    },
    collectionSlug: {
        type: Sequelize.STRING,
    },
    collectionName: {
        type: Sequelize.STRING,
    },
    collectionBanner: {
        type: Sequelize.STRING,
    },
    collectionTwitter: {
        type: Sequelize.STRING,
    },
    collectionWebsite: {
        type: Sequelize.STRING,
    },
    avgDeriskPrice: {
        type: Sequelize.STRING,
    },
    floorPrice: {
        type: Sequelize.STRING,
    },
    lowerMarketlace: {
        type: Sequelize.STRING,
    },
    buyCount: {
        type: Sequelize.STRING,
    },
    mintCount: {
        type: Sequelize.STRING,
    },
    soldCount: {
        type: Sequelize.STRING,
    },
    remaining: {
        type: Sequelize.STRING,
    },
    avgBuy: {
        type: Sequelize.STRING,
    },
    avgSold: {
        type: Sequelize.STRING,
    },
    realisedProfit: {
        type: Sequelize.STRING,
    },
    potentialProfit: {
        type: Sequelize.STRING,
    },
    roi: {
        type: Sequelize.STRING,
    },
    userAvatar: {
        type: Sequelize.STRING,
    },
    visualTitle: {
        type: Sequelize.STRING,
    },
    nbMembersInvolved: {
        type: Sequelize.STRING,
    },
    totalTradeCount: {
        type: Sequelize.STRING,
    },
});




//Profile
const profileData = sequelize.define('profile', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    authorAvatar: {
        type: Sequelize.STRING,
    },
    authorName: {
        type: Sequelize.STRING,
    },
    authorTwitter: {
        type: Sequelize.STRING,
    },
    authorDiscord: {
        type: Sequelize.STRING,
    },
    authorJoined: {
        type: Sequelize.STRING,
    },
    authorWeb2: {
        type: Sequelize.STRING,
    },
    authorWeb3: {
        type: Sequelize.STRING,
    },
    authorJobs: {
        type: Sequelize.STRING,
    },
    authorNature: {
        type: Sequelize.STRING,
    },
    privacyMode: {
        type: Sequelize.STRING,
    },
    visualSelect: {
        type: Sequelize.STRING,
    },
});



//Wallets
const wallets = sequelize.define('wallets', {
    walletsId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    walletName: {
        type: Sequelize.STRING,
    },
    walletAddress: {
        type: Sequelize.STRING,
    },
    walletCategory: {
        type: Sequelize.STRING,
    },
    authorUsername: {
        type: Sequelize.STRING,
    }
});



//Vouch
const vouchData = sequelize.define('vouch', {
    walletsId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    serverId: {
        type: Sequelize.STRING,
    },
    vouchTimestamp: {
        type: Sequelize.STRING,
    },
    memberId: {
        type: Sequelize.STRING,
    },
    vouchReason: {
        type: Sequelize.STRING,
    },
});


//Wallet Generator
const walletsgenerated = sequelize.define('walletgenerator', {
    walletsId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    walletAddress: {
        type: Sequelize.STRING,
    },
    privateKey: {
        type: Sequelize.STRING,
    }
});


//Watchlist
const watchlistSql = sequelize.define('watchlist', {
    walletsId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    selectedCollection: {
        type: Sequelize.STRING,
    },
    collectionName: {
        type: Sequelize.STRING,
    },
    collectionChain: {
        type: Sequelize.STRING,
    },

});


//Report
const reportsql = sequelize.define('report', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    botId: {
        type: Sequelize.STRING,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    serverName: {
        type: Sequelize.STRING,
    },
    authorRole: {
        type: Sequelize.STRING,
    },
    serverId: {
        type: Sequelize.STRING,
    },
    date: {
        type: Sequelize.STRING,
    },
    reportType: {
        type: Sequelize.STRING,
    },
    reportCommand: {
        type: Sequelize.STRING,
    },
    reportDescription: {
        type: Sequelize.STRING,
    },
    reportPriority: {
        type: Sequelize.STRING,
    },
    reportState: {
        type: Sequelize.STRING,
    },
});


//Admin
const adminsql = sequelize.define('admin', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    botName: {
        type: Sequelize.STRING,
    },
    botId: {
        type: Sequelize.STRING,
    },
    ownerId: {
        type: Sequelize.STRING,
    },
    ownerName: {
        type: Sequelize.STRING,
    },
    backupOwnerId: {
        type: Sequelize.STRING,
    },
    backupOwnerName: {
        type: Sequelize.STRING,
    },
    mainServerId: {
        type: Sequelize.STRING,
    },
    mainRoleId: {
        type: Sequelize.STRING,
    },
    logChannelId: {
        type: Sequelize.STRING,
    },
    botWallet: {
        type: Sequelize.STRING,
    },
    botIdentifiant: {
        type: Sequelize.STRING,
    },
    botPassword: {
        type: Sequelize.STRING,
    },
    botState: {
        type: Sequelize.STRING,
    },
});


//API Monitor
const apimonitorsql = sequelize.define('api', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    serverId: {
        type: Sequelize.STRING,
    },
    commandName: {
        type: Sequelize.STRING,
    },
    apiCallName: {
        type: Sequelize.STRING,
    },
    apiProvider: {
        type: Sequelize.STRING,
    },
    timestamp: {
        type: Sequelize.STRING,
    },
});


//API Provider
const apiproviderssql = sequelize.define('apiproviders', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    apiProviderName: {
        type: Sequelize.STRING,
    },
    apiMonthlyCall: {
        type: Sequelize.STRING,
    },
    apiDailyCall: {
        type: Sequelize.STRING,
    },
    apiSecondCall: {
        type: Sequelize.STRING,
    },
    apiSubDate: {
        type: Sequelize.STRING,
    },
    apiMonthlyPrice: {
        type: Sequelize.STRING,
    },
    apiDashboardLink: {
        type: Sequelize.STRING,
    },
    apiDocLink: {
        type: Sequelize.STRING
    }
});


//Alert down
const alertsDown = sequelize.define('alertsdown', {
    alertdownId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    collection: {
        type: Sequelize.STRING,
    },
    collectionName: {
        type: Sequelize.STRING,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    fp: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    fp2: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    channelId: {
        type: Sequelize.STRING
    },
});


//Alert up
const alertsUp = sequelize.define('alertsup', {
    alertupId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    collection: {
        type: Sequelize.STRING,
    },
    collectionName: {
        type: Sequelize.STRING,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    fp: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    fp2: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    channelId: {
        type: Sequelize.STRING
    },
});


//Alert up
const usersql = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    userId: {
        type: Sequelize.STRING,
    },
    userName: {
        type: Sequelize.STRING,
    },
    userAvatar: {
        type: Sequelize.STRING,
    },
    serverId: {
        type: Sequelize.STRING,
    },
    timestamp: {
        type: Sequelize.STRING,
    },

});



//Alert up
const walletManager = sequelize.define('walletmanager', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    authorName: {
        type: Sequelize.STRING,
    },
    walletAddress: {
        type: Sequelize.STRING,
    },
    walletPK: {
        type: Sequelize.STRING,
    },
});


//Alert up
const paymentHistory = sequelize.define('payment', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    authorId: {
        type: Sequelize.STRING,
    },
    authorName: {
        type: Sequelize.STRING,
    },
    userAvatar: {
        type: Sequelize.STRING,
    },
    txnHash: {
        type: Sequelize.STRING,
    },
    value: {
        type: Sequelize.STRING,
    },
    from: {
        type: Sequelize.STRING,
    },
    to: {
        type: Sequelize.STRING,
    },
    days: {
        type: Sequelize.STRING,
    },
    treated: {
        type: Sequelize.STRING,
    },
    timestamp: {
        type: Sequelize.STRING,
    },
    randomKey: {
        type: Sequelize.STRING,
    },
});


//Alert up
const data = sequelize.define('data', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    commandName: {
        type: Sequelize.STRING,
    },
    options: {
        type: Sequelize.STRING,
    },
    data: {
        type: Sequelize.STRING,
    },
    timestamp: {
        type: Sequelize.STRING,
    },


});

//Alert up
const erc20 = sequelize.define('erc20', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    interactionId: {
        type: Sequelize.STRING,
    },
    contractAddress: {
        type: Sequelize.STRING,
    },
    name: {
        type: Sequelize.STRING,
    },
    symbol: {
        type: Sequelize.STRING,
    },
    type: {
        type: Sequelize.STRING,
    },
    table1: {
        type: Sequelize.STRING,
    },
    table2: {
        type: Sequelize.STRING,
    },
    table3: {
        type: Sequelize.STRING,
    },
    abi: {
        type: Sequelize.STRING,
    },
    notableFunctions: {
        type: Sequelize.STRING,
    },
    sourceCode: {
        type: Sequelize.STRING,
    },
    embed1: {
        type: Sequelize.STRING,
    },
    embed2: {
        type: Sequelize.STRING,
    },
    embed3: {
        type: Sequelize.STRING,
    },
    components1: {
        type: Sequelize.STRING,
    },
    components2: {
        type: Sequelize.STRING,
    },
    components3: {
        type: Sequelize.STRING,
    },
    created: {
        type: Sequelize.STRING,
    },
    verified: {
        type: Sequelize.STRING,
    },


});



//Synching the tables

accessSql.sync();
interactionData.sync();
profileData.sync();
wallets.sync();
vouchData.sync();
walletsgenerated.sync();
watchlistSql.sync();
reportsql.sync();
adminsql.sync();
apimonitorsql.sync();
apiproviderssql.sync();
usersql.sync()
alertsDown.sync();
alertsUp.sync();
walletManager.sync()
paymentHistory.sync()
data.sync()
erc20.sync()


//Export the tables informations
module.exports = {
    sequelize,
    accessSql,
    interactionData,
    profileData,
    wallets,
    vouchData,
    walletsgenerated,
    watchlistSql,
    reportsql,
    adminsql,
    apimonitorsql,
    apiproviderssql,
    usersql,
    alertsDown,
    alertsUp,
    walletManager,
    paymentHistory,
    data,
    erc20,
    Op,
}


