# merge-multi-timeframe

A utility for merging multiple arrays of sorted ascending time-series data based on their common date intervals. This package automatically selects the dataset with the shortest common interval as the lower timeframe base and aligns other datasets with an efficient two-pointer approach.

---

## Features

- **Adaptive Lower-Timeframe Selection:** Automatically selects the dataset with the shortest common date interval as the base.
- **Flexible Date Handling:** Supports Date objects, millisecond timestamps, second timestamps, and valid date strings (millisecond timestamps are recommended).
- **Optimized Merging:** Uses chunking (default size `1000`) plus a two-pointer strategy for large datasets.
- **Controlled Future Leakage:** `leakFutureValues` is a required boolean that explicitly controls alignment mode.
- **Leakproof Mode:** `leakFutureValues: false` prevents future-value leakage from higher timeframes by aligning with closed-candle availability.
- **Open-Aligned Mode:** `leakFutureValues: true` aligns by candle open timestamps (can intentionally include future values for backtesting/research workflows).
- **Selective Key Preservation:** `keepKey` lets you keep original property names for one selected dataset key (base or non-base).
- **Optional Undersampling:** `undersampleByKey` lets you use a higher-timeframe dataset as output cadence.
- **Configurable Undersample Output Shape:** `undersampleShape` controls how undersampled lower-timeframe rows are attached (`1d`, `2d`, `flat`).

---

## Installation

```bash
npm install merge-multi-timeframe
```

---

## Usage

### Standard merge (lower timeframe as output cadence)

```js
import { mergeMultiTimeframes } from 'merge-multi-timeframe';

const inputObj = {
  nvda1h: [
    { date: '2025-04-08 08:00:00', close: 20 },
    { date: '2025-04-08 09:00:00', close: 21 },
    { date: '2025-04-08 10:00:00', close: 22 },
    { date: '2025-04-08 11:00:00', close: 23 }
  ],
  spy1d: [
    { date: '2025-04-07', close: 199 },
    { date: '2025-04-08', close: 205 }
  ]
};

const mergedData = mergeMultiTimeframes({
  inputObj,
  target: 'date',
  chunkSize: 1000,
  maxFrequencySize: 10,
  keepKey: 'nvda1h', // keep original keys for nvda1h only
  leakFutureValues: false // required: false prevents higher-timeframe future leakage
});

console.log(mergedData);
```

Example output:

```json
[
  {
    "date": "2025-04-08 08:00:00",
    "close": 20,
    "spy1d_date": "2025-04-07",
    "spy1d_close": 199
  }
]
```

### Open-aligned mode (future values allowed)

```js
const mergedData = mergeMultiTimeframes({
  inputObj,
  target: 'date',
  leakFutureValues: true
});
```

With `leakFutureValues: true`, higher-timeframe rows are aligned by their open date/time (instead of the last closed higher-timeframe candle).

### Undersample by a higher timeframe

```js
const inputObj = {
  btc_1h: [
    { date: '2025-04-08 00:00:00', close: 10 },
    { date: '2025-04-08 01:00:00', close: 11 },
    { date: '2025-04-08 02:00:00', close: 12 },
    { date: '2025-04-08 03:00:00', close: 13 }
  ],
  btc_2h: [
    { date: '2025-04-08 00:00:00', close: 100 },
    { date: '2025-04-08 02:00:00', close: 101 }
  ]
};

const mergedData = mergeMultiTimeframes({
  inputObj,
  target: 'date',
  undersampleByKey: 'btc_2h', // must be a higher-timeframe key
  keepKey: 'btc_2h',
  leakFutureValues: true,
  undersampleShape: '1d' // optional, default '1d'
});

console.log(mergedData);
```

Example output:

```json
[
  {
    "date": "2025-04-08 00:00:00",
    "close": 100,
    "btc_1h_date": [
      "2025-04-08 00:00:00",
      "2025-04-08 01:00:00"
    ],
    "btc_1h_close": [
      10,
      11
    ]
  }
]
```

When `undersampleByKey` is enabled, lower-timeframe rows are embedded into the selected higher-timeframe row using `undersampleShape`.

### Undersample shapes

```js
// 1d (default)
mergeMultiTimeframes({
  inputObj,
  target: 'date',
  leakFutureValues: true,
  undersampleByKey: 'btc_2h',
  undersampleShape: '1d'
});
// => { ...btc_2hRow, btc_1h_close: [10, 11], btc_1h_open: [9, 10], ... }

// 2d
mergeMultiTimeframes({
  inputObj,
  target: 'date',
  leakFutureValues: true,
  undersampleByKey: 'btc_2h',
  undersampleShape: '2d'
});
// => { ...btc_2hRow, btc_1h: [{open, high, low, close, volume, date}, {...}] }

// flat
mergeMultiTimeframes({
  inputObj,
  target: 'date',
  leakFutureValues: true,
  undersampleByKey: 'btc_2h',
  undersampleShape: 'flat'
});
// => { ...btc_2hRow, btc_1h_[0]_close: 10, btc_1h_[1]_close: 11, ... }
```

---

## API

### `mergeMultiTimeframes(options)`

Merges multiple time-series arrays based on common date intervals.

#### Parameters

- **`options.inputObj`** (Object, required)
  Object where each property is a dataset array (timeframe).

- **`options.target`** (string, optional, default: `'date'`)
  Property name used as timestamp/date.

- **`options.chunkSize`** (number, optional, default: `1000`)
  Chunk size used by the internal two-pointer merge logic.

- **`options.maxFrequencySize`** (number, optional, default: `10`)
  Number of initial rows used to estimate each dataset interval.

- **`options.keepKey`** (string or `null`, optional, default: `null`)
  Dataset key whose output properties should keep original names.
  If `null`, all merged properties are prefixed as `<datasetKey>_<field>`.

- **`options.leakFutureValues`** (boolean, required)
  Controls higher-timeframe alignment behavior.
  `false`: closed-candle alignment (future-leak resistant).
  `true`: open-date alignment (future values allowed).

- **`options.undersampleByKey`** (string or `null`, optional, default: `null`)
  If provided, must be a higher-timeframe key. Output cadence becomes that key.
  Lower-timeframe datasets are merged into the selected higher-timeframe rows.

- **`options.undersampleShape`** (string, optional, default: `'1d'`)
  Controls shape for undersampled lower-timeframe rows when `undersampleByKey` is set.
  - `'1d'`: `${datasetKey}_${propertyKey}` arrays (current/default behavior).
  - `'2d'`: one property per lower timeframe key containing an array of row objects.
  - `'flat'`: flattened keys `${datasetKey}_[${lowerTimeFrameIndex}]_${propertyKey}`.

#### Returns

- **Array**
  - Default mode (`undersampleByKey: null`): one merged row per lower-timeframe row.
  - Undersample mode (`undersampleByKey` set): one merged row per selected higher-timeframe row, with lower-timeframe embedding controlled by `undersampleShape`.

#### Error Handling

- Throws if any array in `inputObj` is not ascending by `target`.
- Throws if `keepKey` is not `null`/string, is empty, or does not exist in `inputObj`.
- Throws if `leakFutureValues` is `undefined` or not boolean.  
  Expected behavior: `false` prevents future-value leakage (closed-candle alignment), `true` allows future values via open-date alignment.
- Throws if `undersampleByKey` is not `null`/string, is empty, does not exist in `inputObj`, or points to the lower-timeframe key.
- Throws if `undersampleShape` is not one of `'1d'`, `'2d'`, or `'flat'`.
- Throws if intervals cannot be inferred from provided data.

---

## How It Works

1. **Preprocessing**
   Every row receives an internal `_mill` timestamp in milliseconds.

2. **Interval Detection**
   For each dataset, the package estimates the most common interval from the first `maxFrequencySize` rows.

3. **Lower-Timeframe Detection**
   The dataset with shortest interval is identified as lower timeframe.

4. **Merging**
   - Default mode: lower timeframe drives output; each other dataset contributes one aligned row.
   - Undersample mode: selected higher timeframe drives output; lower timeframes contribute all rows in each selected window.

5. **Output Keys**
   Prefixing is applied per dataset except for the key selected by `keepKey`.

---

## Migration Note

`keepBaseKey` was replaced by `keepKey`.

- Old: `keepBaseKey: true` (only affected base dataset).
- New: `keepKey: '<datasetKey>'` (can target base or non-base dataset).

`leakproof` was replaced by `leakFutureValues` and is now required.

- Old: `leakproof: true` (future-leak resistant).
- New: `leakFutureValues: false` (future-leak resistant).
- Old: `leakproof: false` (open-date alignment).
- New: `leakFutureValues: true` (open-date alignment).

---

## Contributing

Contributions are welcome. Feel free to open an issue or submit a pull request.
