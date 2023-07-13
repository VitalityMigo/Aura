function getTimeAgo(timestamp) {
    const currentTime = new Date().getTime();
    const difference = currentTime - timestamp * 1000; // Convertir le timestamp en millisecondes
  
    // Calculer les jours, heures et minutes correspondantes
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  
    // Construire la chaîne de résultat en fonction de la différence de temps
    if (days > 0) {
      return days + ' days ago';
    } else if (hours > 0) {
      return hours + ' hrs ago';
    } else {
      return minutes + ' mins ago';
    }
  }

  module.exports = getTimeAgo;
