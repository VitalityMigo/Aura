function convertTimestamp(timestamp) {
    // Obtenir la date actuelle en millisecondes
    var now = new Date().getTime();
    
    // Convertir le timestamp en millisecondes
    var timestampMs = timestamp * 1000;
    
    // Calculer la différence en millisecondes entre la date actuelle et le timestamp
    var difference = now - timestampMs;
    
    // Convertir la différence en jours et en heures
    var days = Math.floor(difference / (1000 * 60 * 60 * 24));
    var hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    
    // Retourner la chaîne de caractères avec le format "X days ago" ou "X hours ago"
    if (days > 0) {
      return days + " days ago";
    } else {
      return hours + " hours ago";
    }
  }

  module.exports = convertTimestamp;
