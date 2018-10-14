import NodeTemplate from "../src/NodeTemplate";

const createDocumentFragment = (window !== undefined && window.document !== undefined && window.document.createRange !== undefined)
    ? (tagText) => window.document.createRange().createContextualFragment(tagText)
    : (tagText) => {
        const parser = new window.DOMParser()
        const __document__ = parser.parseFromString(tagText, "text/html")
        const fragment = window.document.createDocumentFragment()
        Array.from(__document__.body.childNodes).forEach(n => fragment.appendChild(n))
        return fragment
}
function cleanInputString(tagText, options) {
    options = Object.assign({}, options)
    let { removeComments, replaceAttributeValueQuotes } = options
    
    if(removeComments){
        // remove js line comments.
        tagText = tagText.replace(/\s*\/\/.*?$/gm, "")
        // remove js multi line comments.
        // @warning: does not work nested !!
        tagText = tagText.replace(/\/\*{1,}[^]*?\*\//, "")
        // remove html comments.
        // @warning: does not work nested !!
        tagText = tagText.replace(/\<\!\-\-[^]*?\-\-\>/g, "")
    }

    // remove all newlines, tabs and returns from the tagText string to create one line
    // regex: [\n\t\r]
    // subst: null
    tagText = tagText.replace(/[\n\t\r]/g, "")

    // style multiline specific:
    // ------------------------------------------------------------------
    // remove all spaces > 2 
    // regex: \s{2,}
    // subst: null
    tagText = tagText.replace(/\s{2,}/g, " ")
    
    // add space after every ; in style attributes
    // regex: ;([^\s])
    // subst: ; $1
    tagText = tagText.replace(/;([^\s])/g, "; $1")
    
    // remove space before "> close combination
    // regex: \s(">)
    // subst: $1
    tagText = tagText.replace(/\s(">)/g, "$1")    
    // ------------------------------------------------------------------


    // remove all whitespace between tags but not inside of tags
    // regex: >\s*<
    // subst: ><
    tagText = tagText.replace(/>\s*</g, "><")

    // remove all whitespace before the first tag or after the last tag
    // regex: ^(\s*)|(\s*)$
    // subst: null
    tagText = tagText.replace(/^(\s*)|(\s*)$/g, "")

    // remove spaces before tagText nodes
    // regex: >\s*
    // subst: >
    tagText = tagText.replace(/>\s*/g, ">")
    
    // remove spaces after tagText nodes
    // regex: \s*<
    // subst: <
    tagText = tagText.replace(/\s*</g, "<")

    // remove space between opening tag and first attribute
    // regex: (<\w*)(\s{2,})
    // subst: $1\s
    tagText = tagText.replace(/(<\w+)(\s{2,})/g, "$1 ")

    // remove space between attributes (trailing space)
    // regex: ([\w-_]+="[\w\s-_]+")(\s*(?!>))
    // subst: $1\s
    tagText = tagText.replace(/([\w-_]+="[\w\s-_]+")(\s*(?!>))/g, "$1 ")

    // remove space between last attribute and closing tag
    // regex: (\w+="\w+")(\s+)>
    // subst: $1>
    tagText = tagText.replace(/([\w-_]+="[\w\s-_]+")(\s{2,})>/g, "$1>")
    
    if(replaceAttributeValueQuotes){
        // tagText = tagText.replace()
    }

    // console.log("cleaned tagText string:", tagText)
    return tagText
}
function iterate(n, cb){
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


const fragment = createDocumentFragment(cleanInputString(`
    <div id="rec-start" data-ref="rec-start">
        <div>
            <div>
                <div>
                    <div>
                        <div id="rec-child-end" data-ref="rec-child-end"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
    <div id="rec-sibling-end" data-ref="rec-sibling-end"></div>
`))
console.log(fragment)

let refs = {}
let ids = {}
Array.from(fragment.childNodes).forEach(tagGroup => iterate(tagGroup, n => {
    // add data-ref references
    let ref = undefined
    if(n.dataset === undefined){
        ref = n.getAttribute("data-ref")
        if(ref !== null){
            refs[ref] = n
        }
    } else {
        ref = n.dataset.ref
        if(ref !== undefined){
            refs[ref] = n
        }
    }
    // add node id references
    if (n.id !== "") {
        ids[n.id] = n
    }
}))

let refStrings = [
    "rec-start",
    "rec-child-end",
    "rec-sibling-end",
]
let idStrings = [
    "rec-start",
    "rec-child-end",
    "rec-sibling-end",
]
// https://jsperf.com/dom-element-reference-access
// high performance version if creation time is important
// new NodeTemplate(`...`, {
//     refs: [
//         "rec-start",
//         "rec-child-end",
//         "rec-sibling-end",
//     ],
//     ids: [
//         "rec-start",
//         "rec-child-end",
//         "rec-sibling-end",
//     ],
// })
let refs = {
    "rec-start": fragment.querySelector("[data-ref=rec-start]"),
    "rec-child-end": fragment.querySelector("[data-ref=rec-child-end]"),
    "rec-sibling-end": fragment.querySelector("[data-ref=rec-sibling-end]"),
}
let ids = {
    "rec-start": fragment.getElementById("rec-start"),
    "rec-child-end": fragment.getElementById("rec-child-end"),
    "rec-sibling-end": fragment.getElementById("rec-sibling-end"),
}