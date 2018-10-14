const R = document.createRange()

export default class NodeTemplate {
    constructor(tagText, options) {
        if(typeof tagText !== "string"){
            throw new Error("You need to provide a HTML/XML/SVG String as first parameter.")
        }

        this.text = cleanInputString(tagText, { removeComments: true })
        this.fragment = R.createContextualFragment(this.text)
     
        // add node references
        if(options){
            const { refs, ids } = options
            if(refs){
                this.refs = refs.reduce((acc, curr) => {
                    acc[curr] = this.fragment.querySelector(`[data-ref="${curr}"]`)
                    return acc
                }, {})
            }
            if(ids){
                this.ids = ids.reduce((acc, curr) => {
                    acc[curr] = this.fragment.getElementById(curr)
                    return acc
                }, {})
            }
        } else {
            const createReferences = (() => {
                // add element references from 'data-tref' and 'id' attributes
                this.refs = {}
                this.ids = {}
                Array.from(this.fragment.childNodes).forEach(tagGroup => iterate(tagGroup, n => {
                    // add data-ref references
                    let ref = undefined
                    if(n.dataset === undefined){
                        ref = n.getAttribute("data-ref")
                        if(ref !== null){
                            this.refs[ref] = n
                        }
                    } else {
                        ref = n.dataset.ref
                        if(ref !== undefined){
                            this.refs[ref] = n
                        }
                    }
                    // add node id references
                    if (n.id !== "") {
                        this.ids[n.id] = n
                    }
                }))
            })()
        }

        // add root reference
        this.root = (this.fragment.childNodes.length === 1)
            ? this.fragment.firstElementChild
            : Array.from(this.fragment.childNodes)
    }
}


function cleanInputString(tagText, options){
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
            throw new Error("First parameter must be Node.")
        }
    }

    iterate(n)

    return false
}
function getQueryType(query){
    return  query instanceof Node ? "Node" : 
            query.charAt(0) === "." ? "id" : 
            query.charAt(0) === "#" ? "class" : "query"
}

