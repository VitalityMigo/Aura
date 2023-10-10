const axios = require('axios')
const fs = require("fs")


const lastIdFile = './contracts/friendtech/lastid.json';
const newUsersFile = './contracts/friendtech/newuser.json';
const addTimeout = require("../functions/addtimeout")
const getTwitterScore = require("../functions/twitteraudit")


async function main() {
    while (true) {

        let userId = getLastUserId()

        try {
            const userExists = await axios.get("https://prod-api.kosetto.com/users/by-id/" + userId, { headers: headerGenerator() });

            if (userExists.data.twitterUsername) {

                saveUserToFile(userExists.data)

                console.log("User found. Looping the monitor. Nb: " + userId);

                userId++;
                setLastUserId(userId)

                await addTimeout(3);

            } else {
                console.log("User not found. Retrying the monitor.");
                await addTimeout(6.5);
            }
        } catch (error) {

            if (error.message.includes("404")) {
                console.log("User not found. Retrying the monitor.");
                await addTimeout(6.5);
            } else if (error.message.includes("401")) {
                console.log("User not found. Retrying the monitor.");
                await addTimeout(60);
            }

        }

    }
}

main()

//module.exports = main


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
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        // 'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4N2Y5ZWUwNTRkZmNiZmUwZDQ1OTE0M2E1MmFmODE2NTJlOTQxNzNkIiwiaWF0IjoxNjk2NzY1NzUyLCJleHAiOjE2OTkzNTc3NTJ9.kS46a4bYlUfEFPfUtzihZVjvc7L91HNn6z9CM3z_Cc4',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Origin': 'https://www.friend.tech',
        'Pragma': 'no-cache',
        'Referer': 'https://www.friend.tech/',
        'Sec-Ch-Ua': '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
        'Sec-Ch-Ua-Mobile': '?0',
        //'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],

    };



    return header;
}

function getLastUserId() {

    if (fs.existsSync(lastIdFile)) {
        const data = fs.readFileSync(lastIdFile, 'utf8');
        return JSON.parse(data).lastUserId;
    } else {
        console.error("Error checking state file");
    }
}


function setLastUserId(userId) {
    const data = {
        lastUserId: userId
    };
    fs.writeFileSync(lastIdFile, JSON.stringify(data), 'utf8');
}


async function saveUserToFile(userData) {



    const twitterAudit = await getTwitterScore(userData.twitterUsername)

    if ((typeof twitterAudit.capital === 'number' && !isNaN(twitterAudit.capital)) && (typeof twitterAudit.data.follower === 'number' && !isNaN(twitterAudit.data.follower)) && (typeof twitterAudit.data.following === 'number' && !isNaN(twitterAudit.data.following))) {

        const userObject = {
            username: userData.twitterUsername,
            name: userData.twitterName,
            address: userData.address,
            pfp: twitterAudit.data.pfpUrl.replace("_normal", ""),
            score: twitterAudit.capital,
            followers: twitterAudit.data.follower,
            following: twitterAudit.data.following,

        }

        // Lisez le fichier JSON existant
        let existingData = [];

        if (fs.existsSync(newUsersFile)) {
            const fileContent = fs.readFileSync(newUsersFile, 'utf8');
            existingData = JSON.parse(fileContent);
        }

        // Ajoutez le nouvel utilisateur à la liste existante
        existingData.push(userObject);

        // Écrivez le fichier JSON avec la nouvelle liste
        fs.writeFileSync(newUsersFile, JSON.stringify(existingData, null, 2));

    }
}