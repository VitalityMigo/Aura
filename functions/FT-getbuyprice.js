function getBuyPriceAfterFees(sharesSubjectSupply, amount) {
    const protocolFeePercent = 5 * 1e18; // Remplacez par le pourcentage réel
    const subjectFeePercent = 5 * 1e18;

    const supply = sharesSubjectSupply;
    const sum1 = supply === 0 ? 0 : Math.floor((supply - 1) * supply * (2 * (supply - 1) + 1) / 6);
    const sum2 = (supply === 0 && amount === 1) ? 0 : Math.floor((supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6);
    const summation = sum2 - sum1;
    const price = Math.floor(summation * (1e18 / 16000));
    const protocolFee = Math.floor((price * protocolFeePercent) / 1e18);
    const subjectFee = Math.floor((price * subjectFeePercent) / 1e18);
    const totalPrice = (price + protocolFee + subjectFee) / 10
    return totalPrice;
}

module.exports = getBuyPriceAfterFees
