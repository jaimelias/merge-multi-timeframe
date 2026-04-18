export const computedOneObj = (inputObj, chunkSize, keepKey = null) => {
  const [prefix, arr] = Object.entries(inputObj)[0];
  const preserveOriginalKey = keepKey === prefix;
  const len = arr.length;
  const output = new Array(len);

  // Process in chunks of size `chunkSize`
  for (let start = 0; start < len; start += chunkSize) {
    const end = Math.min(start + chunkSize, len);

    for (let i = start; i < end; i++) {
      const row = {};
      for (const [k, v] of Object.entries(arr[i])) {
        row[preserveOriginalKey ? k : `${prefix}_${k}`] = v;
      }
      output[i] = row;
    }
  }

  return output;
};
