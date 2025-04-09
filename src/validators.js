export const validateInputObj = inputObj => {
    if(typeof inputObj !== 'object')
    {
        throw new Error('Invalid param. "inputObj" must be and object.')
    }
    if(Object.keys(inputObj).length < 2)
    {
        throw new Error('Invalid param. "inputObj" must have at least 2 object with arrays.')
    }

    return true
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