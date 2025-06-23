export const validateInputObj = (inputObj, keepBaseKey) => {
  if (typeof inputObj !== 'object' || inputObj === null || Array.isArray(inputObj)) {
    throw new Error('Invalid param. "inputObj" must be a non-null object.')
  }

  const keys = Object.keys(inputObj)
  const len = keys.length

  if (len < 1) {
    throw new Error('Invalid param. "inputObj" must have at least one key.')
  }

  if (typeof keepBaseKey !== 'boolean') {
    throw new Error('Invalid param. "keepBaseKey" must be boolean.')
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