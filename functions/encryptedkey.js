const crypto = require('crypto');

const generateEncryptionKey = () => {
  const keyLength = 128 / 8; // 128 bits = 16 octets
  const key = crypto.randomBytes(keyLength).toString('hex');
  return key;
};

const encryptionKey = generateEncryptionKey();
console.log(encryptionKey);

module.exports = generateEncryptionKey;
