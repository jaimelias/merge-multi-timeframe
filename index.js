import { getCommonDateDistancePrecomputed } from "./src/mergeUtilities.js";
import {dateFormaters, selectDateFormatter} from "./src/dateUtilities.js";


/* 
All merged object properties will be prefixed with _${keyName}_ to denote their source.

The mergeMultiTimeframes function selects the array with the shortest interval between target values as the base.

Arrays in inputObj must be sorted in ascending order, with the most recent items at the end.

Each array’s target value can be a Date object, a millisecond timestamp, a second timestamp, or a valid date string (millisecond timestamps are recommended).

All arrays must have at least 2 items to calculate the distances a asign priorities (10 arrays minimum recommended). 
*/

export const mergeMultiTimeframes = ({inputObj, target = 'date', chunkSize = 1000}) => {
  
    /* use dateFormaters from the previous code to parse the date values */
    let largestDistanceKey = '';
    let largestDistanceTotal = 0;
    const keyNameDistances = {};
  
    // === Precompute timestamps for all rows ===
    for (const [keyName, arrObj] of Object.entries(inputObj)) {
  
      // Determine the largest keyName (by count) for the primary loop.
      if (arrObj.length > largestDistanceTotal) {
        largestDistanceKey = keyName;
        largestDistanceTotal = arrObj.length;
      }
  
      const targetVal0 = arrObj[0][target]
      const formatterName = selectDateFormatter(targetVal0)
  
      // Precompute timestamp for each row.
      for (let i = 0; i < arrObj.length; i++) {
        const row = arrObj[i];
  
        // Computes milliseconds directly
        if(formatterName === 'milliseconds')
        {
          row._mill = row[target]
        }
        // Computes seconds*1000 directly
        else if(formatterName === 'seconds')
        {
          row._mill = row[target] * 1000
        }
        // Creates a Date object and gets the time in milliseconds
        else{
          let d = dateFormaters[formatterName](row[target])
          row._mill = d.getTime()
        }
      }
    }
  
    // === Compute common date distances using precomputed timestamps ===
    for (const [keyName, arrObj] of Object.entries(inputObj)) {
      keyNameDistances[keyName] = getCommonDateDistancePrecomputed(arrObj, keyName);
    }
  
    // This will contain the merged rows.
    const baseArrObj = [];
  
    // --- Start of Modified Merging Process ---
    //
    // We first split the primary array (largest keyName) and each secondary array into
    // nested arrays (chunks) of 1000 items.
    //
    // Next, for every primary row we perform a two-pointer search on each secondary keyName
    // (using a global pointer per secondary array that we don’t reset for every primary row).
    //
  
    // Helper: chunk an array into subarrays of a given size.
    const chunkArray = (arr, size) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
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
  
    // Chunk the primary (largest keyName) array.
    const primaryArr = inputObj[largestDistanceKey];
    const primaryChunks = chunkArray(primaryArr, chunkSize);
  
    // For each secondary keyName, create a nested array (chunks of 1000) and
    // initialize a pointer to track our progress in that array.
    const secondaryChunksMap = {};
    const secondaryPointers = {};
    for (const [keyName, arr] of Object.entries(inputObj)) {
      if (keyName === largestDistanceKey) continue;
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
                  mergedRow[`_${largestDistanceKey}_${k}`] = v;
                }
              }
              // Add secondary row properties with the keyName prefix.
              for (const [k, v] of Object.entries(tempSecRow)) {
                if (k === '_mill') continue;
                mergedRow[`_${keyName}_${k}`] = v;
              }
            }
            advancePointer(tempPointer, secChunks);
            tempSecRow = getCurrentRow(secChunks, tempPointer);
          }
        }
  
        if (mergedRow) {
          baseArrObj.push(mergedRow);
        }
      }
    }
  
    // --- End of Modified Merging Process ---
  
    return baseArrObj;
};
  