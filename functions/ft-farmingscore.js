
function farmingFTScore(type, scoreTrader, scoreSubject) {

console.log("ici")

    let capital = 0
    let form = ""

    if (type == "Mutual") { capital += 65 }
    else if (type == "Entry") { capital += 25 }
    else if (type == "Exit") { capital -= 10 }
    else if (type == "Sell") { capital -= 20 }
    else if (type == "Buy") { capital += 10 }



    if (scoreTrader <= 20) { capital -= 10 }
    if (scoreTrader > 20 && scoreTrader <= 40) { capital += 8 }
    else if (scoreTrader > 40 && scoreTrader <= 60) { capital += 14 }
    else if (scoreTrader > 60 && scoreTrader <= 80) { capital += 20 }
    else if (scoreTrader > 80) { capital += 30 }

    if (scoreSubject <= 20) { capital -= 5 }
    if (scoreSubject > 20 && scoreSubject <= 40) { capital += 2 }
    else if (scoreSubject > 40 && scoreSubject <= 60) { capital += 4 }
    else if (scoreSubject > 60 && scoreSubject <= 80) { capital += 7 }
    else if (scoreSubject > 80) { capital += 10 }

    if (scoreSubject > 50 && scoreTrader > 50) { capital += 10 }
    else if (scoreSubject > 75 && scoreTrader > 75) { capital += 20 }
    else if (scoreSubject < 20 && scoreTrader < 20) { capital -= 5 }





    if (capital < 20) { form = "❌ Very unlikely" }
    else if (capital >= 20 && capital < 40) { form = "❌ Unlikely" }
    else if (capital >= 40 && capital <= 60) { form = "🌓 Moderate" }
    else if (capital >= 60 && capital <= 80) { form = "✅ Likely" }
    else if (capital >= 80) { form = "✅ Most Likely" }


    return form


}

module.exports = farmingFTScore