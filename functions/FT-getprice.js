function getPrice(supply, amount) {
    const sum1 = supply === 0 ? 0 : (supply - 1) * supply * (2 * (supply - 1) + 1) / 6;
    const sum2 = (supply === 0 && amount === 1) ? 0 : (supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6;
    const summation = sum2 - sum1;
    return (summation * 1e18) / 16000; // Convertir en wei (1 ether = 1e18 wei)
}

module.exports = getPrice