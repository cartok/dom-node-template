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
        // proof: https://jsperf.com/object-iteration-bench
        let refs = this.refs
        if(refs){
            for(let k in refs){
                this.refs[k].remove()
            }
            delete this.refs
        }

        let ids = this.ids
        if(ids){
            for(let k in ids){
                this.ids[k].remove()
            }
            delete this.ids
        }

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
    }
}

// constructor
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
        // proof:  https://jsperf.com/for-vs-foreach/75
        // proof:  https://jsperf.com/reduce-vs-loop/12
        if(refs){
            that.refs = {}
            for(let i = refs.length; i--;){
                that.refs[refs[i]] = that.fragment.querySelector(`[data-ref="${refs[i]}"]`)
            }
        }
        if(ids){
            that.ids = {}
            for(let i = ids.length; i--;){
                that.ids[refs[i]] = that.fragment.getElementById(refs[i])
            }
        }
    } else {
        // perf: use for-reverse-decement-condition
        // proof:  https://jsperf.com/for-vs-foreach/75
        // perf: use recursion
        // proof: https://jsperf.com/dom-traversal-recursive-vs-iterative
        let nodes = Array.from(that.fragment.childNodes)
        for(let i = nodes.length; i--;){
            iterate(nodes[i], () => {
                // add data-ref references
                let ref = undefined
                if(nodes[i].dataset === undefined){
                    ref = nodes[i].getAttribute("data-ref")
                    if(ref !== null){
                        that.refs[ref] = nodes[i]
                    }
                } else {
                    ref = nodes[i].dataset.ref
                    if(ref !== undefined){
                        that.refs[ref] = nodes[i]
                    }
                }
                // add node id references
                if(nodes[i].id !== "") {
                    that.ids[nodes[i].id] = nodes[i]
                }
            })
        } 
    }
}

// methods
function getQueryType(query){
    return  query instanceof Node ? "Node" : 
            query.charAt(0) === "." ? "id" : 
            query.charAt(0) === "#" ? "class" : "query"
}

// helper
function iterate(node, callback){
    if(node !== null){
        if(!((node instanceof Node) && (node.nodeType === Node.ELEMENT_NODE))){
            throw new Error("First parameter must be Node.ELEMENT_NODE.")
        }
        // execute callback
        callback(node)
        if(node.hasChildNodes){
            iterate(node.firstElementChild, callback)
        }
        if(node.nextElementSibling !== null){
            iterate(node.nextElementSibling, callback)
        }
    }
}


