export const validateInputObj = inputObj => {
    if(typeof inputObj !== 'object' && inputObj)
    {
        throw new Error('Invalid param. "inputObj" must be and object.')
    }

    const len = Object.keys(inputObj).length

    if(len < 1)
    {
        throw new Error('Invalid param. "inputObj" must have at least 1 object with arrays.')
    }

    return len
} 

export const validateArrObj = (arrObj, keyName, target) => {

    if(!Array.isArray(arrObj)) {
        throw new Error(`Type error: "inputObj[${keyName}]" is not an array.`)
    }

    if(arrObj.length < 2)
    {
        throw new Error(`Invalid array lenght: "inputObj[${keyName}]" requires at least 2 rows. Two rows are enough but we recommend to add at least 10 rows.`)
    }

    if(!arrObj[0].hasOwnProperty(target))
    {
        throw new Error(`Target property "${target}" not found in "inputObj[${keyName}][0]" array.`)
    }

    return true
}