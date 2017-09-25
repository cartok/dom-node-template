/**
 * The iterate function gets a node and a callback function... 
 * It starts iterating the dom from the node, recoursively executing the callback.
 * If the callback function itself does not call 'return', the iterate function
 * will return false after executing the recursion.
 */
export default (n: Node, cb: Function) => {
    let itCounter = 0
    const iterate = (n) => {
        if (n !== null && n.nodeType === Node.ELEMENT_NODE) {
            // execute callback with validated node.
            cb(n)
            itCounter++
            // traverse...
            if (n.hasChildNodes) {
                iterate(n.firstElementChild)
            }
            if (n.nextElementSibling !== null) {
                iterate(n.nextElementSibling)
            }
        } else if (itCounter === 0){
            throw new Error("parameter 1 is not of type 'Node'.")
        }
    }

    iterate(n)

    return false
}

