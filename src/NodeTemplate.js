/**
 * @todo: add methods for appending and removing nodes
 * ==============> (getNode, addNode, removeNode)
 * @thesis:
 * - does the 'DOMParser' find out latest SVG namespace on its own?
 * - is there a need to create SVG nodes by namespace? 
 * 
 * @DOMParser: this needs a headless browser for testing.
 * 
 * @todo: filter the html comments out of the text. 
 */

/**
 * @feature: automated xml type distinction
 * use-case: html text including svg
 * requirements: if no type parameter was passed in constructor
 *
 * example:
 * html = `
 * <div id="html-0">
 *      <h1>text</h1>
 *      <h2>text</h2>
 *      <svg id="svg-1">
 *          <g><rect></rect></g>
 *          <g>
 *              <foreignObject>
 *                  <div id="foreignObject"></div>
 *              </foreignObject>
 *          </g>
 *      </svg>
 *      <div>
 *          <svg id="svg-2"></svg>
 *      </div>
 * </div>`
 * 
 * separation algorithm ideas:
 * - before cleanInputString() divide the string into parts:
 * <div>
 *      <h1>text</h1>
 *          <!-- svg 1 was here -->
 *      <div>
 *          <svg></svg>
 *      </div>
 * </div>`
 * 
 * <svg>
 *      <g><rect></rect></g>
 *      <g>
 *          <foreignObject></foreignObject>
 *      </g>
 * </svg>
 * 
 *      <div>
 *           <svg></svg>
 *      </div>
 * 
 */
import iterate from "./helpers/iterate.js"


const DOMParser = new window.DOMParser()
const DEFAULT_OPTIONS = {
    type: "text/html", // "application/xml" "image/svg+xml"
    nodeOnly: false,
}

/**
 * About 'DOMStrings' for querys: https://developer.mozilla.org/en-US/docs/Web/API/DOMString
 */
export default class NodeTemplate {
    /**
     * 
     * @param {String} text  
     * @param {String} type is a MIME type (text/html, image/svg+xml, text/xml)
     * @param {any} options 
     */
    constructor(text: String, options: Object) {
        if(typeof text !== "string"){
            throw new Error("you need to provide a xml string as first parameter.")
        }

        // clean the input string and transform it to a one-line string
        this.text = cleanInputString(text)

        // check if start- and closing-tag match
        let matches = this.text.match(/^<([a-zA-Z\d]*)[^>]*>.*<\/([a-zA-Z\d]*)[^>]*>$/)
        if(matches === null){
            throw new Error("your start and closing tags seem to be invalid.")
        } else {
            // remove the first match (it is the whole string)
            matches = matches.filter((match, i) => i > 0)
        }
        const firstTag = matches[0]
        const lastTag = matches[1]
        const tagsMatch = (firstTag === lastTag)

        if(!tagsMatch){
            throw new Error("the start and close tag of your xml text do not match.")
        }

        // if no mime type parameter is given find out the mime type
        if(options === undefined || options !== undefined && options.type === undefined){
            // automated svg or html distinction
            // assumption: if the html does not start and end with "<svg>" it is html 
            console.warn("automated html and svg distinction only works if your svg starts with the <svg>-tag.")
            const generatedType = (firstTag === "svg") ? "image/svg+xml" : "text/html"
            if(options === undefined){
                options = {}   
            }
            options.type = generatedType
            // console.log("overridden type:", generatedType)
        }

        // merge default options with options
        options = Object.assign({}, DEFAULT_OPTIONS, options)

        // allow 'easy' type specification
        options.type = (options.type === "svg") ? "image/svg+xml" : options.type
        options.type = (options.type === "html") ? "text/html" : options.type
        options.type = (options.type === "xml") ? "application/xml" : options.type

        // parse
        const doc = DOMParser.parseFromString(this.text, options.type)

        // add type info
        this.type = options.type

        // @todo: add new feature to allow svg in html text
        // (for the first version ignore foreignObject)

        // add fragment
        switch(options.type){
            case "text/html":
                // the 'DOMParser' returns a whole document. 
                // create a new lightweight 'DocumentFragment', 
                // and add all body nodes to it.
                this.fragment = window.document.createDocumentFragment()
                Array.from(doc.body.childNodes).forEach(n => this.fragment.appendChild(n.cloneNode(true)))
                break
            case "application/xml":
                console.warn("xml support not finished")
                break
            case "image/svg+xml":
                // the 'DOMParser' returns a SVGDocumentFragment. 
                this.fragment = doc
                break
        }

        // add element references from 'data-tref' and 'id' attributes
        this.refs = {}
        this.ids = {}

        iterate(this.fragment.firstChild, (n) => {
            // add node data references
            // @thesis: for svg 2 the data-* implementation is not finished yet.
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
        if(options.nodeOnly === false){
            this.root = (this.fragment.childNodes.length === 1) ? this.fragment.firstChild : undefined
            const hasRoot = (root === undefined) ? false : true
            if(!hasRoot){
                console.warn("Got no root element!")
                console.warn("Use NodeTemplate.fragment to append your template.")
            }
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