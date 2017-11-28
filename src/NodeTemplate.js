import iterate from "./helpers/iterate.js"


const DEFAULT_OPTIONS = {}
// let rootNode = undefined

// @thesis: 
// jsdom's or xmldom's window.document does not support the createContextualFragment() method
// - search for a in browser testing suite.
// - or detect that the method is missing when testing with jsdom and reimplement the method.
if( (window === undefined) || (window !== undefined && window.DOMParser === undefined) ){
    throw new Error("DOMParser constructor is not defined. If you do TDD or BDD and the code is not executed in a Browser you need a browser replacement.")
}
const createDocumentFragment = (window !== undefined && window.document !== undefined && window.document.createRange !== undefined)
    ? (tagText) => window.document.createRange().createContextualFragment(tagText)
    : (tagText: String) => {
        const parser = new window.DOMParser()
        const __document__ = parser.parseFromString(tagText, "text/html")
        const fragment = window.document.createDocumentFragment()
        Array.from(__document__.body.childNodes).forEach(n => fragment.appendChild(n))
        return fragment
    }


/**
 * TEXT
 * @todo: finish methods
 * > about 'DOMStrings' for querys: https://developer.mozilla.org/en-US/docs/Web/API/DOMString
 * @todo: filter the html comments out of the tagText + option parameter
 */
export default class NodeTemplate {
    /**
     * TEXT
     * Usage for HTML:              new NodeTemplate(`<tags></tags>`) 
     * Usage for HTML with SVG:     new NodeTemplate(`<tags></tags>`, { hasSvg: true }) 
     * Usage for SVG:               new NodeTemplate(`<tags></tags>`, { isSvg: true }) 
     * @param {String} tagText a string of tags.  
     * @param {any} options an object with flags: hasSvg, isSvg.
     */
    constructor(tagText: String, options: Object) {
        // parameter handling
        if(typeof tagText !== "string"){
            throw new Error("you need to provide a xml string as first parameter.")
        }

        // options handling
        // - merge default options with options
        // - destructure options
        options = Object.assign(DEFAULT_OPTIONS, options)
        let { isSvg, hasSvg } = options

        // @feature: remove comments
        // clean the input string and transform it to a clean one-line string
        this.text = cleanInputString(tagText)

        // get <svg> tag count
        const hasMultipleSvgs = (() => {
            let matches = this.text.match(/<svg[^>]*>/g)
            return (matches !== null) ? (matches.length > 1) : false
        })()

        // get node name of first tag
        const nodeNameFirstTag = (() => {
            let matches = this.text.match(/^<([a-zA-Z\d]+)[^>]*>/)
            return (matches !== null) ? matches[1] : undefined
        })()

        // @improvement/accuracy: add distinction algorithm using npm packages "svg-tag-names" etc.
        // if options.isSvg is not given and options.hasSvg is true:
        // - find out if the 'tagText' it is SVG anyways.
        if(isSvg === undefined && hasSvg !== true){
            // assumption: the 'tagText' is SVG if the 'nodeName' of the first tag is "svg".
            isSvg = (nodeNameFirstTag === "svg") ? true : false
        }

        // if <svg> tag(s) exists 
        // - find out if a <foreignObject> tag exist
        const hasForeignObject = (() => {
            if(isSvg === true || hasSvg === true || hasMultipleSvgs === true){
                let matches = this.text.match(/<foreignObject[^>]*>/)
                return (matches !== null) ? (matches.length > 0) : false
            } else {
                return false
            }
        })()

        // if <foreignObject> tag exists 
        // - find out if multiple <foreignObject> tags exist
        const hasMultipleForeignObjects = (() => {
            if(hasForeignObject === true){
                let matches = this.text.match(/<foreignObject[^>]*>/g)
                return (matches !== null) ? (matches.length > 1) : false
            } else {
                return false
            }
        })()

        // namespace handling
        // regex patterns:
        // match any attributes or none: ((\s[a-zA-Z_-]+=["'][^\s]+["'])*)?
        // match xmlns attribute: (\sxmlns=["'][^\s]+["'])
        // match to end of tag: ([^>]*>)
        if(isSvg === true && hasMultipleSvgs === false){
            // if "image/svg+xml" for first element: replace existing xmlns attribute or add it. 
            // same pattern like before, but for any starting tag and not global.
            this.text = this.text.replace(/(<[a-zA-Z]+)((\s[a-zA-Z_-]+=["'][^\s]+["'])*)?(\sxmlns=["'][^\s]+["'])([^>]*>)/, `$1 xmlns="http://www.w3.org/2000/svg"$2$5`)
        }

        // if one or more svgs exist
        // - for all <svg>: replace existing xmlns attribute or add it. 
        // > the resulting pattern will remove old xmlns attribute and add a new xmlns attribute directly after the tag name
        if(hasSvg === true || hasMultipleSvgs === true){
            this.text = this.text.replace(/(<svg)((\s[a-zA-Z_-]+=["'][^\s]+["'])*)?(\sxmlns=["'][^\s]+["'])([^>]*>)/g, `$1 xmlns="http://www.w3.org/2000/svg"$2$5`)
        }

        // if <foreignObject>s exist 
        // - for all <foreignObject>.firstChild: replace existing xmlns attribute or add it. 
        // > the resulting pattern will remove old xmlns attribute and add a new xmlns attribute directly after the tag name
        if(hasForeignObject === true){
            this.text = this.text.replace(/(<foreignObject[^>]*><[a-zA-Z\d]+)((\s[a-zA-Z_-]+=["'][^\s]+["'])*)?(\sxmlns=["'][^\s]+["'])([^>]*>)/g, `$1 xmlns="http://www.w3.org/1999/xhtml"$2$5`)
        }

        // parse
        this.fragment = createDocumentFragment(this.text)

        // /*
        // 'It\'s a HTML Fragment with a unifying root element containing just one <svg> tag without a <foreignObject> tag. without a <svg> tag without  a <foreignObject> tag.'
        // 'It\'s a SVG Fragment with a unifying root element containing just one <svg> tag without a <foreignObject> tag. without a <svg> tag without  a <foreignObject> tag.'
        // */
        // // add type info text
        // this.info = "It's a"
        // + `${  !isSvg ?                                                             " HTML Fragment"                    :   " SVG Fragment"  }`
        // + `${  this.fragment.childElementCount > 1 ?                                " without a unifying root element"  :   " with a unifying root element"  }`

        // + `${  isSvg && hasMultipleSvgs ?                                           " containing multiple <svg> tags"   :   " containing just one <svg> tag"  }`
        // + `${  isSvg && hasForeignObject ?                                          " with"                             :   " without"  }`
        // + `${  isSvg && hasForeignObject && hasMultipleForeignObjects ?             " multiple"                         :   " a"  }`
        // + `${  isSvg && hasForeignObject && hasMultipleForeignObjects ?             " <foreignObject> tags."            :   " <foreignObject> tag."  }`

        // + `${  !isSvg && hasSvg ?                                                   " containing"                       :   " without"  }` 
        // + `${  !isSvg && hasSvg && !hasMultipleSvgs ?                               " multiple <svg> tags"              :   " a <svg> tag"  }` 
        // + `${  !isSvg && hasSvg && hasForeignObject ?                               " with"                             :   " without"  } `
        // + `${  !isSvg && hasSvg && hasForeignObject && hasMultipleForeignObjects ?  " multiple"                         :   " a"  }` 
        // + `${  !isSvg && hasSvg && hasForeignObject && hasMultipleForeignObjects ?  " <foreignObject> tags."            :   " <foreignObject> tag."  }` 

        // add element references from 'data-tref' and 'id' attributes
        this.refs = {}
        this.ids = {}
        iterate(this.fragment.firstChild, (n) => {
            // add node data references
            const refName = (n.dataset === undefined) 
                ? n.getAttribute("data-ref")
                : n.dataset.ref
            if (refName !== undefined ) {
                this.refs[refName] = n
            }

            // add node id references
            const idName = n.id
            if (idName !== "") {
                this.ids[idName] = n
            }
        })

        // add root reference
        if(this.fragment.childElementCount === 1){
            this.root = this.fragment.firstChild
        } 
        // if multiple roots exist return them as array
        else if(this.fragment.childElementCount > 1){
            this.root = this.fragment.childNodes
        }
    }
    /**
     * The method returns a 'Node' of the 'NodeTemplate.'
     * @param {String} query: Can be .class, #id or 'DOMString'. 
     */
    getNode(query: String, options: any){
        console.warn("getNode() is not finished yet.")
        options = Object.assign({ firstMatch: true }, options)
        switch(getQueryType(query)){
            case "id":
                return this.ids[query]
            case "class":
            case "query":
                return options.firstMatch === true 
                    ? this.fragment.querySelector(query)
                    : this.fragment.querySelectorAll(query)
            default: 
                throw new Error("query is not valid.")
        }
    }
    /**
     * The method combines 'NodeTemplates'
     * - add n.ids to this.ids [ ]
     * - add n.refs to this.refs [ ]
     * - update tagText or remove tagText? [ ]
     * - validate added ids and refs. [ ]
     * @param {Node | String} position is a 'Node' or a 'String'
     * @param {NodeTemplate} n is another 'NodeTemplate'.
     */
    addNode(position: Node | String, n: NodeTemplate){
        console.warn("addNode() is not finished yet.")
        switch(getQueryType(position)){
            case "Node":
                position.appendChild(n.fragment)
                break
            case "id":
                const parent = this.ids[position]
                parent.appendChild(n.fragment)
                break
            case "class":
            case "query":
                throw new Error("class or query is not implemented.")
            default:
                throw new Error("position is not valid.")
        }
    }
    /**
     * 
     * @param {Node | String} n 
     */
    removeNode(n: Node | String){
        console.warn("removeNode() is not finished yet.")
        switch(getQueryType(n)){
            case "Node":
                throw new Error("removeNode() not implemented for 'Node'.")
            case "id":
                this.ids[n].parentNode.removeChild(this.ids[n])
                break
            case "class":
                throw new Error("removeNode() not implemented for class.")
            case "query":
                throw new Error("removeNode() not implemented for query.")
            default:
                throw new Error("n is not valid.")
        }
    }
}



function cleanInputString(html: String) {
    
    // remove all newlines, tabs and returns from the html string to create one line
    // regex: [\n\t\r]
    // subst: null
    html = html.replace(/[\n\t\r]/g, "")

    // style multiline specific:
    // ------------------------------------------------------------------
    // remove all spaces > 2 
    // regex: \s{2,}
    // subst: null
    html = html.replace(/\s{2,}/g, "")
    
    // add space after every ; in style attributes
    // regex: ;([^\s])
    // subst: ; $1
    html = html.replace(/;([^\s])/g, "; $1")
    
    // remove space before "> close combination
    // regex: \s(">)
    // subst: $1
    html = html.replace(/\s(">)/g, "$1")    
    // ------------------------------------------------------------------


    // remove all whitespace between tags but not inside of tags
    // regex: >\s*<
    // subst: ><
    html = html.replace(/>\s*</g, "><")

    // remove all whitespace before the first tag or after the last tag
    // regex: ^(\s*)|(\s*)$
    // subst: null
    html = html.replace(/^(\s*)|(\s*)$/g, "")

    // remove spaces before tagText nodes
    // regex: >\s*
    // subst: >
    html = html.replace(/>\s*/g, ">")
    
    // remove spaces after tagText nodes
    // regex: \s*<
    // subst: <
    html = html.replace(/\s*</g, "<")

    // remove space between opening tag and first attribute
    // regex: (<\w*)(\s{2,})
    // subst: $1\s
    html = html.replace(/(<\w+)(\s{2,})/g, "$1 ")

    // remove space between attributes (trailing space)
    // regex: ([\w-_]+="[\w\s-_]+")(\s*(?!>))
    // subst: $1\s
    html = html.replace(/([\w-_]+="[\w\s-_]+")(\s*(?!>))/g, "$1 ")

    // remove space between last attribute and closing tag
    // regex: (\w+="\w+")(\s+)>
    // subst: $1>
    html = html.replace(/([\w-_]+="[\w\s-_]+")(\s{2,})>/g, "$1>")
    

    // console.log("cleaned html string:", html)
    return html
}
function getQueryType(query: String | Node){
    return  query instanceof Node ? "Node" : 
            query.charAt(0) === "." ? "id" : 
            query.charAt(0) === "#" ? "class" : "query"
}