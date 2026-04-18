import { getCommonDateDistancePrecomputed } from "./src/mergeUtilities.js";
import { dateFormaters, selectDateFormatter } from "./src/dateUtilities.js";
import { validateInputObj, validateArrObj } from "./src/validators.js";
import { computedOneObj } from "./src/computeOneObj.js";

/*
The mergeMultiTimeframes function selects the array with the shortest common date
interval as the base (lower timeframe). Arrays in inputObj must be sorted in ascending
order, with the most recent items at the end.
*/

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

const getCurrentRow = (chunks, pointer) => {
  if (pointer.chunkIndex >= chunks.length) return null;
  if (pointer.index >= chunks[pointer.chunkIndex].length) return null;
  return chunks[pointer.chunkIndex][pointer.index];
};

const advancePointer = (pointer, chunks) => {
  if (pointer.chunkIndex >= chunks.length) return;
  pointer.index++;
  if (pointer.index >= chunks[pointer.chunkIndex].length) {
    pointer.chunkIndex++;
    pointer.index = 0;
  }
};

const getOutputKey = (datasetKey, propKey, keepKey) => {
  return datasetKey === keepKey ? propKey : `${datasetKey}_${propKey}`;
};

const addRowValues = (targetObj, datasetKey, row, keepKey) => {
  for (const [k, v] of Object.entries(row)) {
    if (k === '_mill') continue;
    targetObj[getOutputKey(datasetKey, k, keepKey)] = v;
  }
};

const addRowsValuesAsArrays = (targetObj, datasetKey, rows, keepKey) => {
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      if (k === '_mill') continue;
      const outputKey = getOutputKey(datasetKey, k, keepKey);
      if (!Array.isArray(targetObj[outputKey])) {
        targetObj[outputKey] = [];
      }
      targetObj[outputKey].push(v);
    }
  }
};

const findSingleMatchRow = (secChunks, pointer, secIntervalDistance, compareMill) => {
  let currentSecRow = getCurrentRow(secChunks, pointer);

  while (currentSecRow && currentSecRow._mill + secIntervalDistance - 1 < compareMill) {
    advancePointer(pointer, secChunks);
    currentSecRow = getCurrentRow(secChunks, pointer);
  }

  if (!currentSecRow) return null;

  if (
    compareMill >= currentSecRow._mill &&
    compareMill <= currentSecRow._mill + secIntervalDistance - 1
  ) {
    return currentSecRow;
  }

  return null;
};

const collectRowsInWindow = (secChunks, pointer, windowStart, windowEnd) => {
  const matchedRows = [];
  let currentSecRow = getCurrentRow(secChunks, pointer);

  while (currentSecRow && currentSecRow._mill < windowStart) {
    advancePointer(pointer, secChunks);
    currentSecRow = getCurrentRow(secChunks, pointer);
  }

  const tempPointer = { chunkIndex: pointer.chunkIndex, index: pointer.index };
  let tempSecRow = getCurrentRow(secChunks, tempPointer);

  while (tempSecRow && tempSecRow._mill <= windowEnd) {
    if (tempSecRow._mill >= windowStart) {
      matchedRows.push(tempSecRow);
    }
    advancePointer(tempPointer, secChunks);
    tempSecRow = getCurrentRow(secChunks, tempPointer);
  }

  return matchedRows;
};

export const mergeMultiTimeframes = ({
  inputObj,
  target = 'date',
  chunkSize = 1000,
  maxFrequencySize = 10,
  keepKey = null,
  leakproof = true,
  undersampleByKey = null
}) => {
  const inputObjLen = validateInputObj(inputObj, keepKey, leakproof, undersampleByKey);

  if (inputObjLen === 1) {
    if (undersampleByKey !== null) {
      throw new Error('Invalid param. "undersampleByKey" requires at least two datasets.');
    }
    return computedOneObj(inputObj, chunkSize, keepKey);
  }

  const keyNameDistances = {};

  for (const [keyName, arrObj] of Object.entries(inputObj)) {
    validateArrObj(arrObj, keyName, target);

    const targetVal0 = arrObj[0][target];
    const formatterName = selectDateFormatter(targetVal0);

    for (let i = 0; i < arrObj.length; i++) {
      const row = arrObj[i];
      const prevRow = arrObj[i - 1];

      if (formatterName === 'milliseconds') {
        row._mill = row[target];
      } else if (formatterName === 'seconds') {
        row._mill = row[target] * 1000;
      } else {
        const d = dateFormaters[formatterName](row[target]);
        row._mill = d.getTime();
      }

      if (typeof prevRow !== 'undefined' && prevRow._mill >= row._mill) {
        throw new Error(`Error: rows in inputObj[${keyName}] array are not in ascending order.`);
      }
    }
  }

  for (const [keyName, arrObj] of Object.entries(inputObj)) {
    keyNameDistances[keyName] = getCommonDateDistancePrecomputed(arrObj, keyName, maxFrequencySize);
  }

  const distanceKeys = Object.keys(keyNameDistances);
  let baseKey = distanceKeys[0];
  let minDistance = keyNameDistances[baseKey];

  for (let i = 1; i < distanceKeys.length; i++) {
    const key = distanceKeys[i];
    const dist = keyNameDistances[key];
    if (dist < minDistance) {
      minDistance = dist;
      baseKey = key;
    }
  }

  const baseIntervalDistance = keyNameDistances[baseKey];

  if (undersampleByKey !== null) {
    if (undersampleByKey === baseKey) {
      throw new Error(`Invalid param. "undersampleByKey" cannot be the lower timeframe key "${baseKey}".`);
    }

    if (keyNameDistances[undersampleByKey] <= baseIntervalDistance) {
      throw new Error(`Invalid param. "undersampleByKey" must reference a higher timeframe key.`);
    }
  }

  const primaryKey = undersampleByKey ?? baseKey;
  const primaryIntervalDistance = keyNameDistances[primaryKey];

  const mergedArrObj = [];
  const primaryArr = inputObj[primaryKey];
  const primaryChunks = chunkArray(primaryArr, chunkSize);
  const secondaryChunksMap = {};
  const secondaryPointers = {};
  const secondaryModes = {};

  for (const [keyName, arr] of Object.entries(inputObj)) {
    if (keyName === primaryKey) continue;
    secondaryChunksMap[keyName] = chunkArray(arr, chunkSize);
    secondaryPointers[keyName] = { chunkIndex: 0, index: 0 };

    secondaryModes[keyName] =
      undersampleByKey !== null && keyNameDistances[keyName] < primaryIntervalDistance
        ? 'undersample'
        : 'single';
  }

  for (const primaryChunk of primaryChunks) {
    for (const primaryRow of primaryChunk) {
      const primaryMill = primaryRow._mill;
      const mergedRow = {};
      let rowIsComplete = true;

      addRowValues(mergedRow, primaryKey, primaryRow, keepKey);

      for (const [keyName, secChunks] of Object.entries(secondaryChunksMap)) {
        const mode = secondaryModes[keyName];
        const pointer = secondaryPointers[keyName];
        const secIntervalDistance = keyNameDistances[keyName];

        if (mode === 'undersample') {
          const windowStart = leakproof ? primaryMill - primaryIntervalDistance : primaryMill;
          const windowEnd = windowStart + primaryIntervalDistance - 1;
          const matchedRows = collectRowsInWindow(secChunks, pointer, windowStart, windowEnd);

          if (matchedRows.length === 0) {
            rowIsComplete = false;
            break;
          }

          addRowsValuesAsArrays(mergedRow, keyName, matchedRows, keepKey);
          continue;
        }

        const secLagDistance =
          leakproof && secIntervalDistance > primaryIntervalDistance ? secIntervalDistance : 0;
        const compareMill = primaryMill - secLagDistance;
        const matchedRow = findSingleMatchRow(secChunks, pointer, secIntervalDistance, compareMill);

        if (!matchedRow) {
          rowIsComplete = false;
          break;
        }

        addRowValues(mergedRow, keyName, matchedRow, keepKey);
      }

      if (rowIsComplete) {
        mergedArrObj.push(mergedRow);
      }
    }
  }

  return mergedArrObj;
};
