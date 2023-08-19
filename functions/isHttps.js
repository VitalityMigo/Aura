
function isHttps(links) {
    var lienRegex = /^(https?:\/\/)/i; // Regex pour vérifier si le lien commence par "http://" ou "https://"
    return lienRegex.test(links);
}

module.exports = isHttps;
