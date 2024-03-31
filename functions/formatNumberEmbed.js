function formatCoinValueSign(number, decimal) {
    const million = 1000000;
    const billion = 1000000000;
    const trillion = 1000000000000;

    let formattedNumber;
    let suffix;

    if (Math.abs(number) >= trillion) {
        number = number / trillion
        formattedNumber = parseFloat(number).toFixed(decimal);
        suffix = "T";
    } else if (Math.abs(number) >= billion) {
        number = number / billion
        formattedNumber = parseFloat(number).toFixed(decimal);
        suffix = "B";
    } else if (Math.abs(number) >= million) {
        number = number / million
        formattedNumber = parseFloat(number).toFixed(decimal);
        suffix = "M";
    } else {
        formattedNumber = new Intl.NumberFormat('en-US').format(parseFloat(number).toFixed(decimal));
        suffix = "";
    }

    return formattedNumber + suffix;
}


module.exports = formatCoinValueSign;
