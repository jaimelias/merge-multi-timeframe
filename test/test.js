import { mergeMultiTimeframes } from "../index.js";

const inputObj = {
    nvda1d: [{date: '2025-04-08 08:00:00', close: 20}, {date: '2025-04-08 09:00:00', close: 21}, {date: '2025-04-08 10:00:00', close: 21}, {date: '2025-04-08 11:00:00', close: 21}],
    spy1d: [{date: '2025-04-07', close: 199}, {date: '2025-04-08', close: 199}],
} 

const mergedArr = mergeMultiTimeframes({inputObj, chunkSize: 1000, target: 'date'})

console.log(JSON.stringify(mergedArr))