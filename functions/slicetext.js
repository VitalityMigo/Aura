function sliceText(texte, limite) {
    if (texte.length <= limite) {
      // Le texte est déjà inférieur ou égal à la limite, aucune modification nécessaire
      return texte;
    } else {
      // Tronquer le texte en enlevant le surplus
      const texteTronque = texte.substring(0, limite);
      return texteTronque;
    }
  }

  module.exports = sliceText;

