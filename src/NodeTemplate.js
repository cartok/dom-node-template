const R = document.createRange()

// https://jsperf.com/node-template-version-comparison
// https://jsperf.com/react-vs-node-template-element-creation
export default class NodeTemplate {
    constructor(tagText, options) {
        if(typeof tagText !== "string"){
            throw new Error("You need to provide a HTML/XML/SVG String as first parameter.")
        }
        this.version = "3.0.1"

        this.text = cleanInputString(tagText)
        try {
            this.fragment = R.createContextualFragment(this.text)
        } catch(error){
            console.error("Could not create DocumentFragment with createContextualFragment(). Your template string has errors.")
            throw error
        }
     
        // add node references
        const { root, refs, ids } = getNodeReferences(this.fragment, options)
        this.root = root
        this.refs = refs
        this.ids = ids
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

function detectComment(text){
    // empty
}
function removeComments(text){
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
    text = lines.join("")
    return text
}
function cleanInputString(tagText){
    // preprocessing
    tagText = removeComments(tagText)
    tagText = tagText.replace(/\s{2,}/g, " ")

    tagText = tagText.replace(/\s?(\/?[<>(]\/?)\s?|\s?(["'),;])|\s?(\=)\s?(["'])\s?/g, "$1$2$3$4")
    
    return tagText
}
function getNodeReferences(fragment, options){
    const result = {
        root: (fragment.childNodes.length === 1)
            ? fragment.firstElementChild
            : Array.from(fragment.childNodes),
        refs: {},
        ids: {},
    }

    if(options){
        const { refs, ids } = options
        // perf: use for-reverse-decement-condition
        // proof:  https://jsperf.com/for-vs-foreach/75
        // proof:  https://jsperf.com/reduce-vs-loop/12
        if(refs){
            for(let i = refs.length; i--;){
                result.refs[refs[i]] = fragment.querySelector(`[data-ref="${refs[i]}"]`)
            }
        }
        if(ids){
            for(let i = ids.length; i--;){
                result.ids[refs[i]] = fragment.getElementById(refs[i])
            }
        }
    } else {
        // perf: use for
        // proof:  https://jsperf.com/for-vs-foreach/75
        // perf: use recursion
        // proof: https://jsperf.com/dom-traversal-recursive-vs-iterative
        const nodes = Array.from(fragment.childNodes)
        for(let i = nodes.length; i--;){
            iterate(nodes[i], node => {
                // add data-ref references
                let ref = undefined
                if(node.dataset === undefined){
                    ref = node.getAttribute("data-ref")
                    if(ref !== null){
                        result.refs[ref] = node
                    }
                } else {
                    ref = node.dataset.ref
                    if(ref !== undefined){
                        result.refs[ref] = node
                    }
                }
                // add node id references
                if(node.id !== "") {
                    result.ids[node.id] = node
                }
            })
        } 
    }

    return result
}

// helpers
function iterate(node, callback){
    if(node !== null){
        if(!((node instanceof Node) && (node.nodeType === Node.ELEMENT_NODE))){
            return
        }
        // execute callback
        callback(node)
        if(node.hasChildNodes()){
            iterate(node.firstElementChild, callback)
        }
        if(node.nextElementSibling !== null){
            iterate(node.nextElementSibling, callback)
        }
    }
}

// method helpers
function getQueryType(query){
    return  query instanceof Node ? "Node" : 
            query.charAt(0) === "." ? "id" : 
            query.charAt(0) === "#" ? "class" : "query"
}
