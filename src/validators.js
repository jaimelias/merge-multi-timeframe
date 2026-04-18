export const validateInputObj = (inputObj, keepKey, leakFutureValues, undersampleByKey) => {
  if (typeof inputObj !== 'object' || inputObj === null || Array.isArray(inputObj)) {
    throw new Error('Invalid param. "inputObj" must be a non-null object.')
  }

  const keys = Object.keys(inputObj)
  const len = keys.length



  if (len < 1) {
    throw new Error('Invalid param. "inputObj" must have at least one key.')
  }

  const uniqueKeyCount = new Set(keys).size

  if (uniqueKeyCount !== len) {
    throw new Error('Invalid param. "inputObj" must not contain duplicate keys.')
  }

  if (keepKey !== null && typeof keepKey !== 'string') {
    throw new Error('Invalid param. "keepKey" must be a string or null.')
  }

  if (typeof keepKey === 'string' && keepKey.length === 0) {
    throw new Error('Invalid param. "keepKey" cannot be an empty string.')
  }

  if (keepKey !== null && !keys.includes(keepKey)) {
    throw new Error(`Invalid param. "keepKey" value "${keepKey}" does not exist in "inputObj".`)
  }

  if (typeof leakFutureValues !== 'boolean') {
    throw new Error(
      'Invalid param. "leakFutureValues" is required and must be boolean. Use false to prevent future-value leakage (closed-candle alignment). Use true to align by open date and allow future values.'
    )
  }

  if (undersampleByKey !== null && typeof undersampleByKey !== 'string') {
    throw new Error('Invalid param. "undersampleByKey" must be a string or null.')
  }

  if (typeof undersampleByKey === 'string' && undersampleByKey.length === 0) {
    throw new Error('Invalid param. "undersampleByKey" cannot be an empty string.')
  }

  if (undersampleByKey !== null && !keys.includes(undersampleByKey)) {
    throw new Error(`Invalid param. "undersampleByKey" value "${undersampleByKey}" does not exist in "inputObj".`)
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
