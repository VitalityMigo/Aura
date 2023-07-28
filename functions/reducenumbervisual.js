function formatNumberVisual(number) {
    const million = 1000000;
    const billion = 1000000000;


    if (Math.abs(number) >= billion) {
        return (number / billion).toFixed(1) + "B";
    } else if (Math.abs(number) >= million) {
        return (number / million).toFixed(1) + "M";
    } else {
        return number.toString();
    }

}

module.exports = formatNumberVisual;