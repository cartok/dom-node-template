const R = document.createRange()

function jsperfStuff(){
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
    var OBJ = randomStrings(15,8).reduce((acc, curr) => {
        acc[curr] = curr
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

}

export default class NodeTemplate {
    constructor(tagText, options) {
        if(typeof tagText !== "string"){
            throw new Error("You need to provide a HTML/XML/SVG String as first parameter.")
        }

        this.text = cleanInputString(tagText, { removeComments: true })
        this.fragment = R.createContextualFragment(this.text)
     
        // add node references
        if(options){
            addReferences(this, options)
        } else {
            addReferences(this)
        }

        // add root reference
        this.root = (this.fragment.childNodes.length === 1)
            ? this.fragment.firstElementChild
            : Array.from(this.fragment.childNodes)
    }
    destroy(){
        // perf: use for-in
        // object iteration benchmark: https://jsperf.com/object-iteration-bench
        let refs = this.refs
        if(refs){
            for(let k in refs){
                this.refs[k].remove()
            }
            delete this.refs
        }
        delete refs

        let ids = this.ids
        if(ids){
            for(let k in ids){
                this.ids[k].remove()
            }
            delete this.ids
        }
        delete ids

        let root = this.root
        if(root){
            if(root instanceof Array){
                for(let k in root){
                    this.root[k].remove()
                }
            } else {
                this.root.remove()
            }
            delete this.root
        }
        delete root
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
function addReferences(that, options){
    that.refs = {}
    that.ids = {}

    if(options){
        const { refs, ids } = options
        // perf: use for-reverse-decement-condition
        // loop benchmark: https://jsperf.com/for-vs-foreach/75
        // object creation benchmark: https://jsperf.com/reduce-vs-loop/12
        if(refs){
            that.refs = {}
            for(let i = refs.length - 1; i--;){
                that.refs[refs[i]] = that.fragment.querySelector(`[data-ref="${refs[i]}"]`)
            }
        }
        if(ids){
            that.ids = {}
            for(let i = ids.length - 1; i--;){
                that.ids[refs[i]] = that.fragment.getElementById(refs[i])
            }
        }
    } else {
        // MORGEN?
        Array.from(that.fragment.childNodes).forEach(tagGroup => iterate(tagGroup, n => {
            // add data-ref references
            let ref = undefined
            if(n.dataset === undefined){
                ref = n.getAttribute("data-ref")
                if(ref !== null){
                    that.refs[ref] = n
                }
            } else {
                ref = n.dataset.ref
                if(ref !== undefined){
                    that.refs[ref] = n
                }
            }
            // add node id references
            if (n.id !== "") {
                that.ids[n.id] = n
            }
            ref = null // does this help in a foreach loop or is it useless?
        }))
    }
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

