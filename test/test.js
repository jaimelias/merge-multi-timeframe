import { promises as fs } from 'fs';
import path from 'path';
import { mergeMultiTimeframes } from "../index.js";

export const loadFile = async ({fileName, pathName = 'test/datasets'}) => {
    try {
        fileName = fileName.toLowerCase()
        const parsedPathName = path.join(process.cwd(), pathName, fileName);
        const data = await fs.readFile(parsedPathName, 'utf8');
        console.log(`File ${pathName}/${fileName} loaded!`);
        return JSON.parse(data); // Optionally return the file content for further processing
    } catch (err) {
        console.log(`Error reading file locally ${pathName}/${fileName}`)
        return false
    }
}

const init = async () => {
    const inputObj = {
        btc_1d: await loadFile({fileName: 'btc-2000.json'}),
        //btc_1h: await loadFile({fileName: 'btc-10000.json'}),
        //btc_5m: await loadFile({fileName: 'btc-100000.json'}),
        //dxy_1d: await loadFile({fileName: 'dxy-2000.json'}),
    } 

    const mergedArr = mergeMultiTimeframes({inputObj, chunkSize: 1000, target: 'date'})

    console.log(mergedArr)
}

init()