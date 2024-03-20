function calculateSimilarity(collectionName, focusedValue) {
  // Convertir les noms en minuscules et les diviser en mots
  const nameWords = collectionName.toLowerCase().split(' ');
  const focusedWords = focusedValue.toLowerCase().split(' ');

  // Initialiser le compteur de similarité et le compteur de correspondance de la première lettre
  let similarityCount = 0;
  let firstLetterMatchCount = 0;

  // Parcourir chaque mot dans le nom de la collection
  nameWords.forEach(nameWord => {
      // Vérifier si le mot de la collection existe dans la valeur ciblée
      if (focusedWords.includes(nameWord)) {
          // Incrémenter le compteur de similarité si le mot est trouvé
          similarityCount++;
          // Vérifier si le premier caractère du mot correspond à la première lettre tapée par l'utilisateur
          if (nameWord.startsWith(focusedValue.toLowerCase().charAt(0))) {
              // Incrémenter le compteur de correspondance de la première lettre
              firstLetterMatchCount++;
          }
      }
  });

  // Calculer la similarité en ajoutant un poids supplémentaire pour les mots commençant par la première lettre tapée par l'utilisateur
  const similarity = (similarityCount + firstLetterMatchCount) / nameWords.length;

  return similarity;
}

module.exports = calculateSimilarity;
