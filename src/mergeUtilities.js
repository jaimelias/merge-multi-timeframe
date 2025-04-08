export const getCommonDateDistancePrecomputed = (arr, keyName) => {
  // Ensure there are at least 2 items to compute a difference.
  if (arr.length < 2) {
    throw new Error(
      `"getCommonDateDistancePrecomputed" detected an array with invalid length in property "${keyName}". 
      Try adding more rows to "${keyName}" array. Two rows are enough but we recommend to add at least 10 rows.`
    );
  }

  let mostCommon = 0;
  let maxCount = 0;
  const frequency = {};
  // Use only up to the first 10 items.
  const limit = Math.min(arr.length, 10);

  for (let i = 1; i < limit; i++) {
    const diff = arr[i]._mill - arr[i - 1]._mill;
    frequency[diff] = (frequency[diff] || 0) + 1;
    if (frequency[diff] > maxCount) {
      maxCount = frequency[diff];
      mostCommon = diff;
    }
  }

  if (mostCommon < 1) {
    throw new Error(
      `"getCommonDateDistancePrecomputed" could not calculate the distance between rows in "${keyName}" array. Try adding more rows to "${keyName}" array. Two rows are enough but we recommend to add at least 10 rows.`
    );
  }
  
  return mostCommon;
};
