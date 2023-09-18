const Twit = require('twit');


//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const consumerKeyTW = process.env.consumer_key
const consumerSecretTW = process.env.consumer_secret
const accessTokenTW = process.env.access_token
const accessTokenSecretTW = process.env.access_token_secret


const Auth = new Twit({
    consumer_key: consumerKeyTW,
    consumer_secret: consumerSecretTW,
    access_token: accessTokenTW,
    access_token_secret: accessTokenSecretTW,
});

async function getTwitterUserInfo(username) {
    try {
        const response = await Auth.get('users/show', { screen_name: username });
        const data = response.data;
        return data;
    } catch (error) {
        console.log("Erreur lors de la récupération du profil Twitter" + error);
    }
}

module.exports = getTwitterUserInfo