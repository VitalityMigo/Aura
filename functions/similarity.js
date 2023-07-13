function calculateSimilarity(collectionName, focusedValue) {
    const nameWords = collectionName.toLowerCase().split(' ');
    const focusedWords = focusedValue.toLowerCase().split(' ');
  
    const intersection = nameWords.filter(word => focusedWords.includes(word));
    const union = [...new Set([...nameWords, ...focusedWords])];
  
    const similarity = intersection.length / union.length;
  
    return similarity;
  }

  module.exports = calculateSimilarity;
