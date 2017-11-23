@thesis: for svg 2 the data-* implementation is not finished yet.
@changes: when i added the svg 2 namespace to svg tags 
this workaround became deprecated. it could still be used if a user passes a string with older xmlns specified.!?
---> correction:
if the text is parsed with "text/html" as type, and the 
svg elements have the svg 2 namespace attribute set,
they will get a dataset as defined in svg 2 on w3c.
else if the text is parsed with "image/svg+xml" as type, and the svg elements have the svg 2 namespace attribute set, they wont get a dataset as defined in svg 2 on w3c.





// jsdom emulates a window object but has no document object.
// to be able to use test with mocha relying jsdom create a separated(?) empty document
if( (window === undefined) || (window !== undefined && window.DOMParser === undefined) ){
    throw new Error("DOMParser constructor is not defined. If you do TDD and the code is not executed in a Browser you need a 'headless browser' instead.")
}
let createDocumentFragment = undefined
let parser = undefined
let _document = undefined
console.log(window.document)
if(window !== undefined && window.document === undefined){
    parser = new DOMParser()
    _document = parser.parseFromString("", "text/html")
    createDocumentFragment = _document.createRange().createContextualFragment
} else {
    createDocumentFragment = window.document.createRange().createContextualFragment
}
