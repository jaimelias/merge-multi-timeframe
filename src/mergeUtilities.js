export const getCommonDateDistancePrecomputed = (arr, keyName, maxFrequencySize) => {

  let mostCommon = 0;
  let maxCount = 0;
  const frequency = {};
  // Use only up to the first 10 items.
  const limit = Math.min(arr.length, maxFrequencySize);

  for (let i = 1; i < limit; i++) {
    const diff = arr[i]._mill - arr[i - 1]._mill;
    frequency[diff] = (frequency[diff] || 0) + 1;
    if (frequency[diff] > maxCount) {
      maxCount = frequency[diff];
      mostCommon = diff;
    }
  }

  // Check if the maximum frequency is lower than our required threshold (arr.length / 2)
  if (maxCount < 1) {
    throw new Error(`Date distance cannot be determined: frequency below threshold. Please add more row to "inputObj[${keyName}]".`);
  }
  
  return mostCommon;
};
