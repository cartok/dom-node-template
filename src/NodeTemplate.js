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
function cleanInputString(text, options){
    options = Object.assign({}, options)
    let { removeComments, replaceAttributeValueQuotes } = options
    
    // perf: string methods (split, fast for)
    // proof: https://jsperf.com/node-template-string-cleanup-remove-comments
    if(removeComments){
        let lines = text.split("\n")
        for(let i = lines.length; i--;){
            let position = lines[i].indexOf("//")
            let found = (position !== -1)
            if(found){
                if(position > 0){
                    // skip 'https://' and 'file:///'
                    let precedingChar = lines[i].charAt(position - 1)
                    let followingChar = lines[i].charAt(position + 2)
                    let subPosition = null
                    while(precedingChar === ":"){
                        if(followingChar === "/"){
                            // continue search in substring
                            position += 3
                            subPosition = lines[i].substring(position).indexOf("//")                
                        } else {
                            // continue search in substring
                            position += 2
                            subPosition = lines[i].substring(position).indexOf("//")                
                        }
                        found = (subPosition !== -1)
                        if(found){
                            // repeat
                            position += subPosition
                            precedingChar = lines[i].charAt(position - 1)
                            followingChar = lines[i].charAt(position + 2)   
                        } else {
                            // while-loop: nothing found => finish search
                            break
                        }
                    }
                    // for-loop: nothing found after detecting https:// or file:/// => next line
                    if(!found){
                        continue
                    }
                }
                // remove comment
                lines[i] = lines[i].substring(0, position)
            }
        }
        text = lines.join("\n")
    }

    // perf: substring loop
    // proof: https://jsperf.com/node-template-string-cleanup-complex
    let index = 0
    let found = false
    let removeSpaceBeforeOffsetOne = false
    let removeSpaceAfterOffsetTwo = false
    let removeSpaceAfterOffsetThree = false
    do {
        removeSpaceBeforeOffsetOne = (index = text.indexOf("\n")) !== -1
            || (index = text.indexOf("\t")) !== -1
            || (index = text.indexOf("  ")) !== -1
            || (index = text.indexOf(" <")) !== -1
            || (index = text.indexOf(" >")) !== -1
            || (index = text.indexOf(" />")) !== -1
            || (index = text.indexOf(" '")) !== -1
            || (index = text.indexOf(" \"")) !== -1
            || (index = text.indexOf(" (")) !== -1
            || (index = text.indexOf(" )")) !== -1
            || (index = text.indexOf(" ,")) !== -1
            || (index = text.indexOf(" ;")) !== -1
        if(removeSpaceBeforeOffsetOne){
            // target-offset = 1
            text = text.substring(0, index) + text.substring(index + 1)
        }

        removeSpaceAfterOffsetTwo = (index = text.indexOf("< ")) !== -1
            || (index = text.indexOf("> ")) !== -1
            || (index = text.indexOf("( ")) !== -1
            || (index = text.indexOf("= \"")) !== -1
        if(removeSpaceAfterOffsetTwo){
            // target-offset = 2
            text = text.substring(0, index + 1) + text.substring(index + 2)
        }

        removeSpaceAfterOffsetThree = (index = text.indexOf("</ ")) !== -1
            || (index = text.indexOf("=\" ")) !== -1
            || (index = text.indexOf(")\" >")) !== -1
        if(removeSpaceAfterOffsetThree){
            // target-offset = 3
            text = text.substring(0, index + 2) + text.substring(index + 3)
        }

        found = removeSpaceBeforeOffsetOne || removeSpaceAfterOffsetTwo || removeSpaceAfterOffsetThree
    } while(found)

    return text
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


