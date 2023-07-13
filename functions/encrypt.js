const crypto = require('crypto');

//Récupérer les clefs API
const dotenv = require("dotenv")
dotenv.config()
const encryptedKeyPk = process.env.encryptedKeyPk

const ENCRYPTION_KEY = encryptedKeyPk
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + encrypted;
}

module.exports = encrypt;
