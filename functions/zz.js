const Twit = require('twit');

const Auth = new Twit({
    consumer_key: "4HEXAtmAq8Tgzin2mRZNw4kUp",
    consumer_secret: "yBtmOpikxJc1iQ0VDXfiRfsjViY4IgvvV1lmCjmZBIDJ3mnQiu",
    access_token: "1078340881755922440-pdBGwK1oVHYYUcCLZ4qutzXYHyQfLF",
    access_token_secret: "fue3aRVD5GjwH4BNxjsu8FlXUUIKo2gI5EF2H7g01fVSm",
});

const axios = require("axios")

async function test() {

    let i
    try {

 i = await axios.get("https://prod-api.kosetto.com/users/0x0ad5f3c9007df9535c4b313a50235d11882872c1")
 console.log(i.status)
} catch (error)  {
console.log(i)
}

    // const response = await Auth.get('users/show', { screen_name: "YYuga80363" });
    // const data = response.data;
    // const text = data.status.text

    // console.log(data.status.text)

    // if (text.includes("I just joined @AuraAnalytics, the #1 trading bot on Friend Tech 😈.")) {
    //     console.log("ici")
    // }
}

test()


function generateRandomTweet() {
    const phrases = [
        "I just joined @AuraAnalytics, the #1 trading bot on Friend Tech. ",
        "Excited to be a part of @AuraAnalytics, the leading trading bot on Friend Tech. ",
        "Joined the ranks at @AuraAnalytics, the premier trading bot for Friend Tech users. ",
        "I am now a member of @AuraAnalytics, the top trading bot on Friend Tech. ",
        "Proud member of @AuraAnalytics, the unmatched trading bot for Friend Tech users. ",
        "Happy to be on board with @AuraAnalytics, the ultimate trading bot on Friend Tech. ",
        "Just became a member of @AuraAnalytics, the best trading bot on Friend Tech. ",
        "Just gained access to @AuraAnalytics, the best trading bot in the Friend Tech community. ",
        "I just joined @AuraAnalytics, the leading trading bot on Friend Tech. ",
        "Joined the ranks at @AuraAnalytics, the go-to trading bot for Friend Tech users. ",
    ];

    const closeWords = [
        "Let's print ",
        "Time to print ",
        "See you at the top ",
    ];

    const emojis = ["😈", "🥷", "🐋", "🌊", "🤖"];

    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const randomWords = closeWords[Math.floor(Math.random() * closeWords.length)];

    // Replace the default emoji in the selected phrase with a random emoji
    const tweet = randomPhrase + randomWords + randomEmoji

    return tweet;
}

// Exemple d'utilisation
//const randomTweet = generateRandomTweet();
//console.log(randomTweet);

async function it() {

    const task = {
        value: "200000000000000000",
        amount: 2,
        takeProfit: "20",
        stopLoss: "-40"
    }

    const stopLoss = parseFloat((parseFloat(task.value / 10 ** 18) / parseInt(task.amount)) * (1 + task.stopLoss / 100))
    const takeProfit = parseFloat((parseFloat(task.value / 10 ** 18) / parseInt(task.amount)) * (1 + task.takeProfit / 100))
    console.log(stopLoss)
    console.log(takeProfit)
}    



//it()