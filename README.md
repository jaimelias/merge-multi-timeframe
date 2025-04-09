# merge-multi-timeframe

A utility for merging multiple arrays of sorted ascending time-series data based on their common date intervals. This package intelligently selects the array with the shortest common interval as the base and then aligns data from other arrays using an efficient two-pointer approach. Each merged property is prefixed with its source key for traceability.

```markdown
# merge-multi-timeframe

A utility for merging multiple arrays of time-series data based on their common date intervals. This package intelligently selects the array with the shortest common interval as the base and then aligns data from other arrays using an efficient two-pointer approach. Each merged property is prefixed with its source key for traceability.

---

## Features

- **Adaptive Base Selection:** Automatically selects the base array using the shortest common date interval.
- **Flexible Date Handling:** Supports Date objects, millisecond timestamps, second timestamps, and valid date strings (millisecond timestamps are recommended).
- **Optimized Merging:** Uses a chunking strategy (default size 1000) combined with a two-pointer search for efficient merging even with large datasets.
- **Clear Source Identification:** Merged properties are prefixed with `_<sourceKey>_` so you know the origin of each piece of data.

---

## Installation

Install the package via npm:

```bash
npm install merge-multi-timeframe
```

---

## Usage

Below is an example of how to use the package in your project.

```js
import { mergeMultiTimeframes } from 'merge-multi-timeframe';

const inputObj = {
    nvda1d: [
        {date: '2025-04-08 08:00:00', close: 20}, 
        {date: '2025-04-08 09:00:00', close: 21}, 
        {date: '2025-04-08 10:00:00', close: 21}, 
        {date: '2025-04-08 11:00:00', close: 21}
    ],
    spy1d: [
        {date: '2025-04-07', close: 199}, 
        {date: '2025-04-08', close: 199}
    ],
} 

const mergedData = mergeMultiTimeframes({
  inputObj,
  target: 'date',           // The key used for date values in your objects.
  chunkSize: 1000,          // Optional, default is 1000.
  maxFrequencySize: 10      // Optional, defaults to 10 items for frequency calculation.
});

console.log(mergedData);
```

---

## API

### `mergeMultiTimeframes(options)`

Merges multiple time-series arrays based on a common date interval.

#### Parameters

- **`options.inputObj`** (Object, **required**)  
  An object where each property is an array representing a timeframe. Every array should consist of objects that include at least one date property (by default named `"date"`).  
  **Note:** Each array must be sorted in ascending order (with the most recent items at the end) and contain at least 2 items to calculate the time intervals. For best results, using 10 or more arrays is recommended.

- **`options.target`** (string, *optional*, default: `'date'`)  
  The property name within each object that represents the timestamp or date.

- **`options.chunkSize`** (number, *optional*, default: `1000`)  
  The size used to split the arrays into chunks. This helps improve the performance of the two-pointer search algorithm used during merging.

- **`options.maxFrequencySize`** (number, *optional*, default: `10`)  
  The maximum number of initial rows used to compute the most common date interval (frequency) in each array. This common interval is used to determine the matching window for the two-pointer search.

#### Returns

- **Array**  
  An array of merged objects. The merged objects will have properties from the base array prefixed with `_<baseKey>_` and from other arrays with `_<sourceKey>_`.

#### Error Handling

- **Order Validation:**  
  If any input array is not in ascending order according to the target date, an error is thrown.

- **Date Interval Calculation:**  
  If the computed frequency of date intervals in any array is below half its length (suggesting inconsistent intervals), an error is thrown recommending to add more data to that timeframe.

---

## How It Works

1. **Preprocessing:**  
   Each row in every timeframe array is pre-processed to calculate a `_mill` property, representing the date in milliseconds. The package detects the format (milliseconds, seconds, or string) and converts appropriately.

2. **Common Date Interval Determination:**  
   For each timeframe, the function computes the most common interval (based on the first few entries determined by `maxFrequencySize`). This helps to define a matching window for merging.

3. **Base Array Selection:**  
   The array with the shortest common date interval is selected as the base array, around which the merging will be performed.

4. **Efficient Merging:**  
   The base array and secondary arrays are divided into chunks (using the `chunkSize` parameter). A two-pointer search is then conducted across the arrays to merge rows whose timestamps fall within a computed time window.

5. **Merged Output:**  
   Only if a primary row finds matching secondary rows in all arrays (or at least in the arrays where a match is applicable) is the merged object created. Properties are prefixed with their source key for clarity.

---

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request on the repository.
