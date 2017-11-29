import iterate from "./helpers/iterate.js"
import XRegExp from "xregexp"

const DOMParser = new window.DOMParser()
const DEFAULT_OPTIONS = {
    type: "text/html",      // "image/svg+xml"
    nodeOnly: false,
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
const DEFAULT_OPTIONS = {}
const parser = new window.DOMParser()



export default class NodeTemplate {
    /**
     * 
     * @param {String} text  
     * @param {String} type is a MIME type (text/html, image/svg+xml, text/xml)
     * @param {any} options 
     */
    constructor(tagText: String, options: Object) {
        if(typeof text !== "string"){
            throw new Error("you need to provide a xml string as first parameter.")
        }

        // @feature: remove comments
        // clean the input string and transform it to a clean one-line string
        this.text = cleanInputString(tagText)

        // get node name of first tag
        const nodeNameFirstTag = (() => {
            let matches = this.text.match(/^<([a-zA-Z\d]+)[^>]*>/)
            return (matches !== null) ? matches[1] : undefined
        })()


        // handle options
        // ------------------------------------------------------------------------------------------
        // - merge default options with options
        // - destructure options
        options = Object.assign(DEFAULT_OPTIONS, options)
        let { 
            isSvg,
            hasSvg,
            // hasMultipleSvgs, 
            // hasForeignObject, 
            // hasMultipleForeignObjects 
        } = options

        // @improvement/accuracy: add distinction algorithm using npm packages "svg-tag-names" etc.
        // if options.isSvg is not given and options.hasSvg is true:
        // - find out if the 'tagText' it is SVG anyways.
        // - assumption: the 'tagText' is SVG if the 'nodeName' of the first tag is "svg".
        if(isSvg === undefined){
            isSvg = (nodeNameFirstTag === "svg") ? true : false
        }

        // check if text has <svg>
        // assumption: if the first tag is not <svg> but multiple svgs
        if(hasSvg === undefined){
            let testOk = /<svg[^>]*>/.test(this.text)
            hasSvg = (nodeNameFirstTag !== "svg") && testOk
        }
        // ------------------------------------------------------------------------------------------


        // add additional information (must happen after options handling)
        // ------------------------------------------------------------------------------------------
        // check if multiple <svg> exist
        const hasMultipleSvgs = (() => {
            let matches = this.text.match(/<svg[^>]*>/g)
            return (matches !== null) ? (matches.length > 1) : false
        })()

        // if <svg> tag(s) exists 
        // - find out if a <foreignObject> tag exist
        const hasForeignObject = (() => {
            if(isSvg || hasSvg || hasMultipleSvgs){
                return /<foreignObject[^>]*>/.test(this.text)
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
        // ------------------------------------------------------------------------------------------

        const addNamespaces = (() => {
            // namespace handling
            // ------------------------------------------------------------------------------------------
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
            // ------------------------------------------------------------------------------------------
        })()

        const parse = (() => {
            // parsing
            // ------------------------------------------------------------------------------------------
            this.fragment = undefined
            // if it's svg
            // - check if multiple tag-groups
            // - create a SVGDocument for each tag-group
            // - append its documentElement to a new DocumentFragment
            if(isSvg){
                const tagGroups = this.text.match(/<([a-zA-Z0-9]+)\b(?:[^>]*>.*?)(<\/\1>)+/g)
                if(tagGroups !== null && tagGroups.length >= 1){
                    // the code below works for 1 or multiple tag-groups.
                    this.fragment = window.document.createDocumentFragment()
                    tagGroups.map(g => parser.parseFromString(g, "image/svg+xml"))
                        .forEach(d => this.fragment.appendChild(d.documentElement))
                } else {
                    throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
                }
            } 
            // if its html with svg
            // * for every 'new' svg:
            //   - add placeholder <div id="svg-X"></div> tag before the svg
            //   - and cut out the whole svg to array (the text will have placeholders with ids instead of svgs)
            // * parse the text as "text/html"
            // * add all document.body.childNodes to 'this.fragment'
            // * for every svgText in the array:
            //   - parse a svg as "image/svg+xml" to another array
            // * for every svgDocument in the array:
            //    - use its array-index to find the placeholder byId
            //    - get the placeholder parent, remove placeholder, append the svg
            else if(hasSvg) {
                var ph = -1
                const placeHolderIdText = "nodetemplate-svg-placeholder-"
                const textWithPlaceholders = this.text.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, match =>{
                    ph += 1 // starts with zero
                    return `<div id="${placeHolderIdText}${ph}"></div>${match}`
                })
                // console.log(textWithPlaceholders)
                const textWithoutSvgTagGroups = textWithPlaceholders.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, ``)
                // console.log(textWithoutSvgTagGroups)
                const doc = parser.parseFromString(textWithoutSvgTagGroups, "text/html")
                const svgTagGroups = this.text.match(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g)
                if(svgTagGroups === null || svgTagGroups.length < 1){
                    throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
                }
                svgTagGroups.map(g => parser.parseFromString(g, "image/svg+xml")).forEach((d, ph) => {
                    const placeHolderNode = doc.getElementById(`${placeHolderIdText}${ph}`)
                    placeHolderNode
                        .parentNode
                        .insertBefore(d.documentElement, placeHolderNode)
                    placeHolderNode
                        .parentNode
                        .removeChild(placeHolderNode)
                })
                this.fragment = window.document.createDocumentFragment()
                // doc.body.childNodes.forEach(n => console.log(n.outerHTML))
                Array.from(doc.body.childNodes).forEach(n => this.fragment.appendChild(n))
                // this.fragment.childNodes.forEach(n => console.log(n.outerHTML))
                // console.dir(this.fragment)
                // console.dir(this.fragment.childNodes)
            } 
            // if it's just html
            // no need to separate the tag-groups if its "text/html".
            else {
                this.fragment = createDocumentFragment(this.text)
            }
            // ------------------------------------------------------------------------------------------
        })()

        const createInfoText = (() => {
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
        })()

        const createReferences = (() => {
            // add element references from 'data-tref' and 'id' attributes
            this.refs = {}
            this.ids = {}
            iterate(this.fragment.firstChild, (n) => {
                // add node data references
                let ref = undefined
                if(options.type === "image/svg+xml"){
                    ref = n.getAttribute("data-ref")
                    if(ref !== null){
                        this.refs[ref] = n
                    }
                } else {
                    ref = n.dataset.ref
                    if (ref !== undefined ) {
                        this.refs[ref] = n
                    }
                }

                // add node id references
                if (n.id !== "") {
                    this.ids[n.id] = n
                }
            })

            // add root reference
            this.root = (this.fragment.childNodes.length === 1)
                ? this.fragment.firstElementChild
                : this.fragment.childNodes
        })()
    }
    /**
     * About 'DOMStrings' for querys: https://developer.mozilla.org/en-US/docs/Web/API/DOMString
     */
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
     * - update text or remove text? [ ]
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

    // remove spaces before text nodes
    // regex: >\s*
    // subst: >
    html = html.replace(/>\s*/g, ">")
    
    // remove spaces after text nodes
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