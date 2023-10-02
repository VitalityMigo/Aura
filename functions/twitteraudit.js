const Twit = require('twit');


//Récupérer les clefs API
const dotenv = require("dotenv");
const { TweetBookmarksTimelineV2Paginator } = require('twitter-api-v2');
dotenv.config()
const consumerKeyTW = process.env.consumer_key
const consumerSecretTW = process.env.consumer_secret
const accessTokenTW = process.env.access_token
const accessTokenSecretTW = process.env.access_token_secret

const getTimeAgo = require("./timeago")



const timeStamp = Math.floor(Date.now() / 1000)
const oneYear = 31536000
const twoMonths = 5259600
const oneDay = 86400




const Auth = new Twit({
    consumer_key: "4HEXAtmAq8Tgzin2mRZNw4kUp",
    consumer_secret: "yBtmOpikxJc1iQ0VDXfiRfsjViY4IgvvV1lmCjmZBIDJ3mnQiu",
    access_token: "1078340881755922440-pdBGwK1oVHYYUcCLZ4qutzXYHyQfLF",
    access_token_secret: "fue3aRVD5GjwH4BNxjsu8FlXUUIKo2gI5EF2H7g01fVSm",
});






async function getTwitterScore(username) {


    
try {

    /// PARTI 1 - TWITTER ///

    const response = await Auth.get('users/show', { screen_name: username });
    const data = response.data;


    // Info de base
    const follower = data.followers_count
    const following = data.friends_count
    const name = data.name
    const user = data.screen_name
    const description = data.description
    const created_at = Math.floor(Date.parse(data.created_at) / 1000)
    const tweetCount = data.statuses_count
    const likesCount = data.favourites_count
    const location = data.location
    const extended = data.has_extended_profile
    const profilePicture = data.profile_image_url_https



    const verified = data.verified
    const isProtected = data.protected
    let isSuspended = false
    if (data.suspended) {
        isSuspended = data.suspended
    }

    const pfp = data.default_profile_image
    const banner = data.profile_banner_url
    const link = data.url

    let lastTweet = 0
    if (data.status) {
        lastTweet = Math.floor(Date.parse(data.status.created_at) / 1000)
    }
    const inListCount = data.listed_count
    const favouriteCount = data.favourites_count

    let isDescription = false
    if (description) { isDescription = true }

    let isPfp = false
    if (pfp == false) { isPfp = true }

    let isBanner = false
    if (banner) { isBanner = true }

    let isLink = false
    if (link) { isLink = true }

    let isLocation = false
    if (location) { isLocation = true }

    let ratio = follower / following

    if (following <= 0) { ratio = 0; }

    const tweetMonthly = tweetCount / calculateMonthDifference(created_at)

    let capital = 100

    
    // On vérifie les incomprésible
    if (isSuspended != true && (isBanner || isPfp || isDescription) && (follower > 0 && following > 0) && ((timeStamp - lastTweet) < oneYear) && ((timeStamp - created_at) > twoMonths)) {


        
        // Malus
        if (!isPfp) { capital -= 80 }
        if (!isBanner) { capital -= 65 }
        if (!isDescription) { capital -= 65 }
        if (!isLocation) { capital -= 20 }
        if (isProtected) { capital -= 30 }



        // Bonus
        if (isLink) { capital += 25 }
        if (isLocation) { capital += 10 }
        if (verified) { capital += 80 }


        // Followers
        if (follower < 50) { capital -= 45 }
        else if (follower >= 50 && follower < 100) { capital -= 30 }
        else if (follower >= 100 && follower < 150) { capital -= 10 }
        else if (follower >= 10000 && follower < 50000) { capital += 10 }
        else if (follower >= 50000) { capital += 20 }




        // Following
        if (following < 50) { capital -= 30 }
        else if (following >= 50 && following < 100) { capital -= 15 }
        else if (following >= 100 && following < 150) { capital -= 5 }
        else if (following >= 5000 && following < 10000) { capital += 5 }
        else if (following >= 10000) { capital += 10 }



        // Nombre de tweet mensuel
        if (tweetMonthly <= 0) { capital -= 80 }
        else if (tweetMonthly > 0 && tweetMonthly <= 5) { capital -= 20 }
        else if (tweetMonthly > 5 && tweetMonthly <= 10) { capital -= 15 }
        else if (tweetMonthly > 10 && tweetMonthly <= 20) { capital -= 10 }
        else if (tweetMonthly >= 50 && tweetMonthly < 100) { capital += 15 }
        else if (tweetMonthly >= 100 && tweetMonthly < 300) { capital += 25 }
        else if (tweetMonthly >= 300) { capital += 40 }



        // Total de tweet
        if (tweetCount <= 0) { capital -= 80 }
        else if (tweetCount > 0 && tweetCount <= 50) { capital -= 20 }
        else if (tweetCount > 50 && tweetCount <= 150) { capital -= 10 }
        else if (tweetCount > 1000 && tweetCount <= 3500) { capital += 15 }
        else if (tweetCount > 3500 && tweetCount <= 5000) { capital += 20 }
        else if (tweetCount > 5000 && tweetCount <= 10000) { capital += 25 }
        else if (tweetCount > 10000) { capital -= 30 }



        //Creation de compte
        let createdSince = timeStamp - created_at
        if (createdSince <= oneDay * 7) { capital -= 50 }
        else if (createdSince > oneDay * 7 && createdSince <= oneDay * 31) { capital -= 35 }
        else if (createdSince > oneDay * 31 && createdSince <= twoMonths * 1.5) { capital -= 20 }
        else if (createdSince > twoMonths * 1.5 && createdSince <= twoMonths * 3) { capital -= 15 }



        // Dernier message
        let messageSince = timeStamp - lastTweet
        if (messageSince >= twoMonths * 6) { capital -= 40 }
        else if (messageSince >= twoMonths * 3 && messageSince < twoMonths * 6) { capital -= 25 }
        else if (messageSince >= twoMonths * 1.5 && messageSince < twoMonths * 3) { capital -= 15 }
        else if (messageSince > oneDay && messageSince < oneDay * 3) { capital += 5 }
        else if (messageSince <= oneDay) { capital += 10 }



        // Listes Twitter
        if (inListCount == 0) { capital -= 30 }
        else if (inListCount > 15 && inListCount <= 30) { capital += 10 }
        else if (inListCount > 30 && inListCount <= 100) { capital += 15 }
        else if (inListCount > 100) { capital += 20 }


        // Like Twitter
        if (likesCount == 0) { capital -= 40 }
        else if (likesCount > 0 && likesCount <= 50) { capital -= 30 }
        else if (likesCount > 50 && likesCount <= 250) { capital -= 20 }
        else if (likesCount > 250 && likesCount <= 500) { capital -= 10 }
        else if (likesCount > 5000 && likesCount <= 10000) { capital += 5 }
        else if (likesCount > 10000) { capital += 10 }




        if (capital > 100) { capital = 100 }
        if (capital < 0) { capital = 0 }



     

        let obj = {}
        obj.follower = follower
        obj.following = following
        obj.tweetCount = tweetCount
        obj.likesCount = likesCount
        obj.created_at = created_at
        obj.description = isDescription
        obj.pfp = isPfp
        obj.banner = isBanner
        obj.pfpUrl = profilePicture




        

        return { capital: capital, data: obj}

    } else {

        
        let obj = {}
        obj.follower = follower
        obj.following = following
        obj.tweetCount = tweetCount
        obj.likesCount = likesCount
        obj.created_at = created_at
        obj.description = isDescription
        obj.pfp = isPfp
        obj.banner = isBanner
        obj.pfpUrl = profilePicture


        capital = 0

        return { capital: capital, data: obj}




    }

} catch (error) {

    console.log("Echec de l'audit du twitter @" + username + " : " + error.stack)

    let obj = {}
    obj.follower = "None"
    obj.following = "None"
    obj.tweetCount = "None"
    obj.likesCount = "None"
    obj.created_at = "None"
    obj.description = "None"
    obj.pfp = "None"
    obj.banner = "None"
    obj.pfpUrl = "https://friend.tech/"


    capital = "Unknown"

    return { capital: capital, data: obj}


}

}

// zone de test
const f = ["Tora69956547", "ug_pavel", "realdexone", "Fajar91772608", "lanyihous", "SkullEther_", "ETHDegen41", "9GAG_DA0", "adi_cornelius", "ErinMi7", "0x_Layer3", "vinaks06", "maylindiazhotma", "emrahcanpolat16", "mustafov71", "ma0604mh", "celcel493", "sunny1jls", "ISIKIEL_3334", "NikkiCa62606456", "takaya159", "memeksari69", "Domdiddy24", "Arab_VIPs", "FariyaAnjum7", "CommunityFt", "EeuEu", "PulleyMind43123", "TangtangLemon", "LauraAzukiEth", "BonillaAPE", "arshadul580", "NikkiCa62606456", "Justinswag161", "Sutrisno_Joyo", "BeylacNFTs", "kwon_token"]
const r = ["david_wolinsky", "capcap_max", "FungibleTokn", "TXMCtrades", "bigbellyNFT", "natealexnft", "risedle", "beam_easy", "abderdh", "habits", "chupebera", "0xBonge", "anes427", "bryptoRomi", "coinbender_lfg", "Luckytradess", "JahonJamali", "crypt0savage", "BobLoukas", "vitalitymigo", "saliencexbt", "0xCaptainLevi", "dingalingts", "0xGlock", "maverick23NFT", "FLC_FlooringLab", "ToTheDemon", "0xSunNFT", "player1_eth", "_GvAll", "bagfaced", "Iam4x", "0ximfat", "HerroCrypto", "0x5f_eth", "ApeDegenNFT", "Own_Your_Flag", "dpeaz", "Felix_anaya", "CapitanCapibara", "Fortunne2", "Web3Shah", "gaatzby", "youfadedwealth", "KyharrTV", "BombNFTs", "gromwtf", "craigscoinpurse", "Double__Zlatan", "shreyans2788", "Arnaudttsiwf"]


module.exports = getTwitterScore





function calculateMonthDifference(timestampInSeconds) {
    // Obtenez la date actuelle en millisecondes
    const currentDate = new Date();

    // Convertissez le timestamp en millisecondes
    const timestampDate = new Date(timestampInSeconds * 1000);

    // Calculez la différence en millisecondes
    const timeDifference = currentDate - timestampDate;

    // Convertissez la différence en mois
    const millisecondsInMonth = 30.44 * 24 * 60 * 60 * 1000; // Environ 30.44 jours par mois
    const monthDifference = Math.floor(timeDifference / millisecondsInMonth);

    return monthDifference;
}



// Fonction de stat
async function getTwitterUserInfo(username) {

    const fake = ["Tora69956547", "ug_pavel", "realdexone", "Fajar91772608", "lanyihous", "SkullEther_", "ETHDegen41", "9GAG_DA0", "adi_cornelius", "ErinMi7", "0x_Layer3", "vinaks06", "maylindiazhotma", "emrahcanpolat16", "mustafov71", "ma0604mh", "celcel493", "sunny1jls", "ISIKIEL_3334", "NikkiCa62606456", "takaya159", "memeksari69", "Domdiddy24", "Arab_VIPs", "FariyaAnjum7", "CommunityFt", "EeuEu", "PulleyMind43123", "TangtangLemon", "LauraAzukiEth", "BonillaAPE", "arshadul580", "NikkiCa62606456", "Justinswag161", "Sutrisno_Joyo", "BeylacNFTs", "kwon_token"]
    const real = ["david_wolinsky", "capcap_max", "FungibleTokn", "TXMCtrades", "bigbellyNFT", "natealexnft", "risedle", "beam_easy", "abderdh", "habits", "chupebera", "0xBonge", "anes427", "bryptoRomi", "coinbender_lfg", "Luckytradess", "JahonJamali", "crypt0savage", "BobLoukas", "vitalitymigo", "saliencexbt", "0xCaptainLevi", "dingalingts", "0xGlock", "maverick23NFT", "FLC_FlooringLab", "ToTheDemon", "0xSunNFT", "player1_eth", "_GvAll", "bagfaced", "Iam4x", "0ximfat", "HerroCrypto", "0x5f_eth", "ApeDegenNFT", "Own_Your_Flag", "dpeaz", "Felix_anaya", "CapitanCapibara", "Fortunne2", "Web3Shah", "gaatzby", "youfadedwealth", "KyharrTV", "BombNFTs", "gromwtf", "craigscoinpurse", "Double__Zlatan", "shreyans2788", "Arnaudttsiwf"]

    try {

        let fullTable = []
        let statTable = []

        let aCount = 0
        let aDescription = false
        let acreatedAt = ""
        let atweetCount = 0
        let aTweetperMonth = 0

        let aVerified = false
        let aProtected = false
        let aSuspended = false
        let aPfp = false
        let aBanner = false
        let aLink = false

        let aLastTweet = ""
        let aList = 0
        let aFavourite = 0

        let aFollowers = 0
        let aFollowing = 0
        let aRatio = 0

        let aLocation = 0
        let aExtended = 0
        let aLikes = 0
        let aLikesToP = 0

        for (const x of real) {


            const response = await Auth.get('users/show', { screen_name: x });
            const data = response.data;

            // console.log(data)


            // Info de base
            const follower = data.follower_count
            const following = data.friends_count
            const name = data.name
            const user = data.screen_name
            const description = data.description
            const created_at = Math.floor(Date.parse(data.created_at) / 1000)
            const tweetCount = data.statuses_count
            const location = data.location
            const extended = data.has_extended_profile
            const likesCount = data.favourites_count


            const isVerified = data.verified
            const isProtected = data.protected
            let isSuspended = data.suspended

            const hasPfp = data.default_profile_image
            let hasBanner = data.profile_banner_url
            let hasUrl = data.url

            let lastTweet = ""
            if (data.status) {
                lastTweet = Math.floor(Date.parse(data.status.created_at) / 1000)
            }
            const inListCount = data.listed_count
            const favouriteCount = data.favourites_count


            aCount++
            if (description) { aDescription++ }
            if (isVerified) { aVerified++ }
            if (isProtected) { aProtected++ }
            if (isSuspended) { aSuspended++ } else { isSuspended = false }
            if (hasPfp == false) { aPfp++ }
            if (hasBanner) { aBanner++ } else { hasBanner = false }
            if (hasUrl) { aLink++ } else { hasUrl = false }
            if (location) { aLocation++ }
            if (extended) { aExtended++ }


            aList += inListCount
            aFavourite += favouriteCount
            atweetCount += tweetCount

            aFollowers += follower
            aFollowing += following
            aLikes += likesCount


            if (aCount > 1) {
                acreatedAt = (created_at + acreatedAt) / 2
            } else { acreatedAt = created_at }
            aTweetperMonth = tweetCount / calculateMonthDifference(created_at)
            aLikesToP = likesCount / calculateMonthDifference(created_at)


            if (lastTweet) {
                if (aCount > 1) {
                    aLastTweet = (aLastTweet + lastTweet) / 2
                } else { aLastTweet = lastTweet }
            }




            // Tableau général
            let obj = {}
            obj.name = name
            obj.user = user
            obj.ratio = parseFloat(follower / following).toFixed(1)
            obj.description = description
            obj.created_at = created_at
            obj.tweetCount = tweetCount
            obj.tweetMonthly = aTweetperMonth
            obj.isVerified = isVerified
            obj.isProtected = isProtected
            obj.isSuspended = isSuspended
            obj.hasPfp = hasPfp
            obj.hasBanner = hasBanner
            obj.hasUrl = hasUrl
            obj.lastTweet = lastTweet
            obj.inListCount = inListCount
            obj.favouriteCount = favouriteCount
            fullTable.push(obj)

        }

        aDescription = (aDescription / aCount) * 100
        // acreatedAt = acreatedAt / aCount
        atweetCount = parseFloat(atweetCount / aCount).toFixed(1)
        aLikes = parseFloat(aLikes / aCount).toFixed(1)

        aVerified = (aVerified / aCount) * 100

        aProtected = (aProtected / aCount) * 100
        aSuspended = (aSuspended / aCount) * 100
        aPfp = (aPfp / aCount) * 100
        aBanner = (aBanner / aCount) * 100
        aLink = (aLink / aCount) * 100
        aLocation = (aLocation / aCount) * 100
        aExtended = (aExtended / aCount) * 100



        // aLastTweet = aLastTweet / aCount
        aList = parseFloat(aList / aCount).toFixed(1)

        aFavourite = parseFloat(aFavourite / aCount).toFixed(1)

        aFollowers = aFollowers / aCount
        aFollowing = aFollowing / aCount
        aRatio = parseFloat(aFollowers / aFollowing).toFixed(1)


        let obj2 = {}
        obj2.count = aCount
        obj2.follower = aFollowers
        obj2.following = aFollowing
        obj2.ratio = aRatio + " /1"

        obj2.descrpiton = aDescription + "%"
        obj2.createdAt = getTimeAgo(acreatedAt) + " - " + acreatedAt
        obj2.tweetCount = parseFloat(atweetCount).toFixed(1)
        obj2.TweetperMonth = parseFloat(aTweetperMonth).toFixed(3)
        obj2.Likes = aLikes
        obj2.LikesPerPost = aLikesToP

        obj2.Verified = parseFloat(aVerified).toFixed(1) + "%"
        obj2.Protected = parseFloat(aProtected).toFixed(1) + "%"
        obj2.Suspended = parseFloat(aSuspended).toFixed(1) + "%"
        obj2.Pfp = parseFloat(aPfp).toFixed(1) + "%"
        obj2.Banner = parseFloat(aBanner).toFixed(1) + "%"
        obj2.Link = parseFloat(aLink).toFixed(1) + "%"
        obj2.Location = parseFloat(aLocation).toFixed(1) + "%"
        obj2.Extended = parseFloat(aExtended).toFixed(1) + "%"
        obj2.LastTweet = getTimeAgo(aLastTweet) + " - " + aLastTweet
        obj2.List = aList
        obj2.Favourite = aFavourite
        statTable.push(obj2)


        console.log(" ")
        console.log("Table Complète : ")
        // console.log(fullTable)
        console.log(" ")
        console.log("//////")
        console.log(" ")
        console.log("Table Stats : ")
        console.log(statTable)


        // return data;
    } catch (error) {
        console.log("Erreur lors de la récupération du profil Twitter " + error.stack);
    }

}
