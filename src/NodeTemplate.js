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
import iterate from "./helpers/iterate.js"


const DOMParser = new window.DOMParser()
const DEFAULT_OPTIONS = {
    nodeOnly: false,
}

export default class NodeTemplate {
    constructor(htmlString: String, options: Object) {
        options = Object.assign({}, DEFAULT_OPTIONS, options)

        // clean
        const text = cleanInputString(htmlString)

        // parse
        const doc = DOMParser.parseFromString(text, "text/html")

        // create DocumentFragment of content
        this.fragment = window.document.createDocumentFragment()
        Array.from(doc.body.childNodes).forEach(n => this.fragment.appendChild(n.cloneNode(true)))

        // add element references from data-tref and id attributes
        this.refs = {}
        this.ids = {}

        iterate(this.fragment.firstChild, (n) => {
            // add node data references
            if (n.dataset.ref !== undefined) {
                this.refs[n.dataset.ref] = n
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
    getNode(query: String){
    }
    addNode(n: NodeTemplate){
    }
    removeNode(n: NodeTemplate | String){
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