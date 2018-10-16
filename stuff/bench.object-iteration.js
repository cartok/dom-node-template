// OBJECT ITERATION
    // -------------------------------------------------------------------
    // preparation
    function randomString(length){
        length = length > 8 ? 8 : length
        let end = length + 2
        return (Math.random() + 1).toString(36).substring(2,end)
    }
    function randomStrings(amount, length){
        return Array.from({length: amount}, () => randomString(length))
    }
    var OBJ = randomStrings(10,8).reduce((acc, curr) => {
        acc[curr] = randomString(10)
        return acc
    }, {})

    // setup
    var obj = Object.assign({}, OBJ)

    // BENCHS
    // object iteration: Object.keys().forEach
    Object.keys(obj).forEach(k => {
        obj[k] = null
    })
    // object iteration: Object.keys()-for-ordered
    var ARR = Object.keys(obj)
    var l = ARR.length - 1
    for(let i = 0; i < l; i++){
        obj[ARR[i]] = null
    }
    // object iteration: Object.keys()-for-reversed-decrement-condition
    var ARR = Object.keys(obj)
    for(let i = ARR.length - 1; i--;){
        obj[ARR[i]] = null
    }
    // object iteration: for-in -------- WINNER!
    for(var k in obj){
        obj[k] = null
    }
    // -------------------------------------------------------------------
