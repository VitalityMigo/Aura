const crypto = require('crypto');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const encryptedKeyPk = process.env.encryptedKeyPk


const ENCRYPTION_KEY = encryptedKeyPk
const IV_LENGTH = 16;

function decrypt(encryptedText) {
    const iv = Buffer.from(encryptedText.substr(0, IV_LENGTH * 2), 'hex');
    const encrypted = encryptedText.substr(IV_LENGTH * 2);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = decrypt;
