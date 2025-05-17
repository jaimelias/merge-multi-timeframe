import { getCommonDateDistancePrecomputed } from "./src/mergeUtilities.js";
import { dateFormaters, selectDateFormatter } from "./src/dateUtilities.js";
import { validateInputObj, validateArrObj } from "./src/validators.js";

/* 
All merged object properties will be prefixed with _${keyName}_ to denote their source.

The mergeMultiTimeframes function selects the array with the shortest common date interval 
(as computed by keyNameDistances) as the base. Arrays in inputObj must be sorted in ascending order, 
with the most recent items at the end.

Each array’s target value can be a Date object, a millisecond timestamp, a second timestamp, 
or a valid date string (millisecond timestamps are recommended).

All arrays must have at least 2 items to calculate the distances; 10 arrays minimum is recommended.
*/

export const mergeMultiTimeframes = ({ inputObj, target = 'date', chunkSize = 1000, maxFrequencySize = 10 }) => {

  validateInputObj(inputObj);
  const keyNameDistances = {};

  // inside mergeMultiTimeframes, *before* your primary‐row loop

  let expectedKeyCount = 0

  // === Precompute timestamps for all rows ===
  for (const [keyName, arrObj] of Object.entries(inputObj)) {
    validateArrObj(arrObj, keyName, target);

    const targetVal0 = arrObj[0][target];
    const formatterName = selectDateFormatter(targetVal0);


    // Precompute timestamp for each row.
    for (let i = 0; i < arrObj.length; i++) {
      const row = arrObj[i];
      const prevRow = arrObj[i - 1];

      // Computes milliseconds directly
      if (formatterName === 'milliseconds') {
        row._mill = row[target];
      } 
      // Computes seconds*1000 directly
      else if (formatterName === 'seconds') {
        row._mill = row[target] * 1000;
      } 
      // Creates a Date object and gets the time in milliseconds
      else {
        let d = dateFormaters[formatterName](row[target]);
        row._mill = d.getTime();
      }

      if (typeof prevRow !== 'undefined' && prevRow._mill >= row._mill) {
        throw new Error(`Error: rows in inputObj[${keyName}] array are not in ascending order.`);
      }
    }

    expectedKeyCount += Object.keys(arrObj[0]).length - 1 //-1 removes _mill count

  }

  // === Compute common date distances using precomputed timestamps ===
  for (const [keyName, arrObj] of Object.entries(inputObj)) {
    keyNameDistances[keyName] = getCommonDateDistancePrecomputed(arrObj, keyName, maxFrequencySize);
  }

  // === Select the base array as the one with the shortest common date interval ===
  // === Select the base array as the one with the shortest common date interval ===
  const distanceKeys = Object.keys(keyNameDistances)
  let baseKey = distanceKeys[0]
  let minDistance = keyNameDistances[baseKey]

  for (let i = 1; i < distanceKeys.length; i++) {
    const key = distanceKeys[i]
    const dist = keyNameDistances[key]
    if (dist < minDistance) {
      minDistance = dist
      baseKey = key
    }
  }

  // This will contain the merged rows.
  const baseArrObj = [];

  // --- Start of Modified Merging Process ---
  //
  // We first split the primary array (baseKey) and each secondary array into
  // nested arrays (chunks) of 1000 items.
  //
  // Next, for every primary row we perform a two-pointer search on each secondary keyName
  // (using a global pointer per secondary array that we don’t reset for every primary row).

  // Helper: chunk an array into subarrays of a given size.
  const chunkArray = (arr, size) => {
    const len = arr.length;
    const count = Math.ceil(len / size);
    const chunks = new Array(count);
    
    for (let i = 0, offset = 0; i < count; i++, offset += size) {
      const end = offset + size > len ? len : offset + size;
      const chunkLen = end - offset;
      const chunk = new Array(chunkLen);
      
      for (let j = 0; j < chunkLen; j++) {
        chunk[j] = arr[offset + j];
      }
      
      chunks[i] = chunk;
    }
    
    return chunks;
  };


  // Helper: get the current element based on a pointer in the nested chunks.
  const getCurrentRow = (chunks, pointer) => {
    if (pointer.chunkIndex >= chunks.length) return null;
    if (pointer.index >= chunks[pointer.chunkIndex].length) return null;
    return chunks[pointer.chunkIndex][pointer.index];
  };

  // Helper: advance the pointer by one element in the nested chunks.
  const advancePointer = (pointer, chunks) => {
    if (pointer.chunkIndex >= chunks.length) return;
    pointer.index++;
    if (pointer.index >= chunks[pointer.chunkIndex].length) {
      pointer.chunkIndex++;
      pointer.index = 0;
    }
  };

  // Chunk the primary (baseKey) array.
  const primaryArr = inputObj[baseKey];
  const primaryChunks = chunkArray(primaryArr, chunkSize);

  // For each secondary keyName, create a nested array (chunks of 1000) and
  // initialize a pointer to track our progress in that array.
  const secondaryChunksMap = {};
  const secondaryPointers = {};
  for (const [keyName, arr] of Object.entries(inputObj)) {
    if (keyName === baseKey) continue;
    secondaryChunksMap[keyName] = chunkArray(arr, chunkSize);
    // Initialize the pointer for this secondary array.
    secondaryPointers[keyName] = { chunkIndex: 0, index: 0 };
  }

  // Iterate over each primary chunk, then process each primary row within.
  for (const primaryChunk of primaryChunks) {
    for (const primaryRow of primaryChunk) {
      const primaryMill = primaryRow._mill;
      let mergedRow = null; // Will store merged data if a match is found.

      // Process each secondary keyName using two-pointer search.
      for (const [keyName, secChunks] of Object.entries(secondaryChunksMap)) {
        const secIntervalDistance = keyNameDistances[keyName];
        const pointer = secondaryPointers[keyName];

        // Advance the global pointer for this secondary keyName if the current row's window is behind primaryMill.
        let currentSecRow = getCurrentRow(secChunks, pointer);
        while (currentSecRow && (currentSecRow._mill + secIntervalDistance - 1 < primaryMill)) {
          advancePointer(pointer, secChunks);
          currentSecRow = getCurrentRow(secChunks, pointer);
        }

        // Use a temporary pointer (copying the global pointer state) to check for possible matches.
        const tempPointer = { chunkIndex: pointer.chunkIndex, index: pointer.index };
        let tempSecRow = getCurrentRow(secChunks, tempPointer);
        while (tempSecRow && tempSecRow._mill <= primaryMill) {
          // Check if primaryMill falls within the secondary row's time window.
          if (primaryMill >= tempSecRow._mill && primaryMill <= tempSecRow._mill + secIntervalDistance - 1) {
            // Create the merged row only once per primary row.
            if (!mergedRow) {
              mergedRow = {};
              for (const [k, v] of Object.entries(primaryRow)) {
                if (k === '_mill') continue;
                mergedRow[`${baseKey}_${k}`] = v;
              }
            }
            // Add secondary row properties with the keyName prefix.
            for (const [k, v] of Object.entries(tempSecRow)) {
              if (k === '_mill') continue;
              mergedRow[`${keyName}_${k}`] = v;
            }
          }
          advancePointer(tempPointer, secChunks);
          tempSecRow = getCurrentRow(secChunks, tempPointer);
        }
      }

      if (mergedRow && Object.keys(mergedRow).length === expectedKeyCount) {
        baseArrObj.push(mergedRow);
      }
    }
  }

  return baseArrObj;
};