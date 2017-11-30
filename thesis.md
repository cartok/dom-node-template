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



// @thesis: recursion here!
    set root(node: Node){
        this.root = node
        rootNode = node
    }



/**

    if i found a solution, algorithm for next step: extract <svg>

    new rules:
    if isSvg == true
    - check if multiple tag groups
        - if true separate them in distinct strings
        - then parse multiple svgdocuments out of it
        - then append all documentElements to 'this.fragment' 
    
    if isSvg == false
    - if containsSvg == true
        - for every 'new' svg:
          add placeholder <div id="svg-X"></div> tag before the svg
          and cut out the whole svg to array
          (the text will have placeholders with ids instead of svgs)
        - parse the text as "text/html"
        - add all document.body.childNodes to 'this.fragment'
        - for every svgText in the array:
          parse a svg as "image/svg+xml" to another array
          - for every svgDocument in the array:
            - use its array-index to find the placeholder byId
            - get the placeholder parent, remove placeholder, append the svg
    
    i guess foreignObjects can just be parsed with the svg as "image/svg+xml"
 */



        // if isSvg == true
        // - check if multiple tag groups
        //     - if true separate them in distinct strings
        //     - then parse multiple svgdocuments out of it
        //     - then append all documentElements to 'this.fragment' 
        // 
        // if isSvg == false
        // - if containsSvg == true
        //     - for every 'new' svg:
        //      add placeholder <div id="svg-X"></div> tag before the svg
        //      and cut out the whole svg to array
        //      (the text will have placeholders with ids instead of svgs)
        //     - parse the text as "text/html"
        //     - add all document.body.childNodes to 'this.fragment'
        //     - for every svgText in the array:
        //       - parse a svg as "image/svg+xml" to another array
        //     - for every svgDocument in the array:
        //        - use its array-index to find the placeholder byId
        //        - get the placeholder parent, remove placeholder, append the svg
        //
        // i guess foreignObjects can just be parsed with the svg as "image/svg+xml"
        //
        // capture the name of the first opening tag
        // ignore attributes and text nodes
        // recursively allow new opening tags
        // recursively match closing tag to opening tag by using captured tag name
        // @thesis: javascript does not support recursive match (?R)
        // -> library extension: http://xregexp.com/
        // <([a-zA-Z0-9]+)\b(?:[^>]*>.*?)(?R)?<\/\1>
        // XRegExp.matchRecoursive method wont work either, can't use capturing group from left in right
        // alternative: <([a-zA-Z0-9]+)\b(?:[^>]*>.*?)(<\/\1>)+    <-- must be '+' not '*'
        // disadvantage: no validation if the number of opening and closing tags are equal! 
        



var rofl = "_HODOR_"
undefined
var lol = "mein name ist _HODOR_!!!"
undefined
lol.match(/`ist ${rofl}`/)
null
lol.match(new RegExp(`ist ${rofl}`))
Array [ "ist _HODOR_" ]