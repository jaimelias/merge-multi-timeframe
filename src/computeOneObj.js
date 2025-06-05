export const computedOneObj = (inputObj, chunkSize) => {
  const [prefix, arr] = Object.entries(inputObj)[0];
  const len = arr.length;
  const output = new Array(len);

  // Process in chunks of size `chunkSize`
  for (let start = 0; start < len; start += chunkSize) {
    const end = Math.min(start + chunkSize, len);

    for (let i = start; i < end; i++) {
      const row = {};
      for (const [k, v] of Object.entries(arr[i])) {
        row[`${prefix}_${k}`] = v;
      }
      output[i] = row;
    }
  }

  return output;
};