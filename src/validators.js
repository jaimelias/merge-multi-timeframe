const validateInputObj = inputObj => {
    if(typeof inputObj !== 'object')
    {
        throw new Error('Invalid param. "inputObj" must be and object.')
    }
    if(Object.keys(inputObj).length < 2)
    {
        throw new Error('Invalid param. "inputObj" must have at least 2 object with arrays.')
    }
} 