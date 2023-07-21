function capFirstLetter(str) {
  if (/^[A-Za-z]/.test(str)) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return str;
}

module.exports = capFirstLetter;
