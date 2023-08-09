function formatNumberVisual(number) {
    const million = 1000000;
    const billion = 1000000000;
    const trillion = 1000000000000;

    let formattedNumber;
    let suffix;

    if (Math.abs(number) >= trillion) {
        number = number / trillion
        formattedNumber = parseFloat(number).toFixed(1);
        suffix = "T";
    } else if (Math.abs(number) >= billion) {
        number = number / billion
        formattedNumber = parseFloat(number).toFixed(1);
        suffix = "B";
    } else if (Math.abs(number) >= million) {
        number = number / million
        formattedNumber = parseFloat(number).toFixed(1);
        suffix = "M";
    } else {
        if (Number.isInteger(number) || parseFloat(number) === parseInt(number)) {
            formattedNumber = parseFloat(number).toFixed(0);
        } else {
            formattedNumber = parseFloat(number).toFixed(1);
        }
        suffix = "";
    }

    return formattedNumber.replace('.0', '') + suffix;
}

module.exports = formatNumberVisual;