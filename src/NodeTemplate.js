const DEFAULT_OPTIONS = {}

const XMLNS_SVG = "http://www.w3.org/2000/svg"
const XMLNS_FO = "http://www.w3.org/1999/xhtml"

const parser = new window.DOMParser()
const createDocumentFragment = (window !== undefined && window.document !== undefined && window.document.createRange !== undefined)
    ? (tagText) => window.document.createRange().createContextualFragment(tagText)
    : (tagText: String) => {
        const parser = new window.DOMParser()
        const __document__ = parser.parseFromString(tagText, "text/html")
        const fragment = window.document.createDocumentFragment()
        Array.from(__document__.body.childNodes).forEach(n => fragment.appendChild(n))
        return fragment
}


export default class NodeTemplate {
    /**
     * 
     * @param {String} text lost info by merging...
     * @param {any} options lost info by merging...
     */
    constructor(tagText: String, options: Object) {
        if(typeof tagText !== "string"){
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

        // get all tag-groups
        /**
        
        - 1.    match from first opening tag to next opening tag
                => (<([a-zA-Z0-9]+)\b(?:[^>]*>.*?))(?=<\2)(.*)
        - 2.1   extract the match, remove it from the string
                ? performance: regex match rest vs. string substring
                => the best would be: get position of the last matched symbol and create a substring from position+1 to end.
                RESULT: https://jsperf.com/extract-text-part-and-update-text-regex-vs-substring/1
        - 2.2.  push the match on stack and save the tag name 
        
        // test of the regex application
        1. <g id="1.0">ANYTHING<g id="1.1">ANYTHING</g><g id="2.0"></g>
        2. <g id="1.1">ANYTHING</g><g id="2.0"></g>
        3. <g id="2.0"></g>
        => 3.   => ERROR: Does not match the group because positive lookahead does not match.
                => RESOLUTION 1: Detect this and handle it 
                => RESOLUTION 2: Change reged end to: (?=<\2|$) ONLY WORKS FOR ONE-LINE TEXT -----------fail, no need, if no match, then to "cascading"


        <g id="1.0">ANYTHING</g><g></g>
        <g id="1.0">ANYTHING<g></g></g>


        str-2: <g id="1.0">ANYTHING</g><g></g>
        reg-2: 	(<([a-zA-Z0-9]+)\b(?:[^>]*>.*?(?!<\/\2>)))(?=<\2|$)|
                (<([a-zA-Z0-9]+)\b(?:[^>]*>.*?)<\/\4>)
        reg-2.2: (<([a-zA-Z0-9]+)\b(?:[^>]*>.*?)<\/\2>)
        str-1: <g id="1.0">ANYTHING</g><rect></rect>
        reg-1: (<([a-zA-Z0-9]+)\b(?:[^>]*>.*?(?!<\/\2>)))(?=<\2|$)
        problem-1: no match at all, cause no second g
        (problem-2): could discard text before first match?
        result-1: if no match, then first tag is not nested in itself again.
        if-1: use reg-2.2 to cut the starting tag group out

        (<([a-zA-Z0-9]+)\b(?:[^>]*>.*?(?!<\/\2>)))(?=<\2|$)


        <g id="1.0">ANYTHING</g><g></g>
        (<([a-zA-Z0-9]+)\b(?:[^>]*>.*?(?!<\/\2>)))(?=<\2|$)
        problem: SHOULD NOT MATCH, NOT NESTED!
         */
        this.tagGroups = undefined
        const tagGroups = this.text.match(/<([a-zA-Z0-9]+)\b(?:[^>]*>.*?)(<\/\1>)+/g)
        if (tagGroups !== null){
            this.tagGroups = tagGroups
        }
        const hasMultipleTagGroups = (tagGroups.length > 1)
        const hasSingleTagGroup = (tagGroups.length === 1)

        // handle options
        // ------------------------------------------------------------------------------------------
        // - merge default options with options
        // - destructure options
        options = Object.assign({}, DEFAULT_OPTIONS, options)
        let { isSvg, htmlWithSvg } = options
        let svgDetected = false

        // @improvement/accuracy: add distinction algorithm using npm packages "svg-tag-names" etc.
        // @outdated-text: if options.isSvg is not given and options.htmlWithSvg is true:
        // @outdated-text: - find out if the 'tagText' it is SVG anyways.
        // @outdated-text: - assumption: the 'tagText' is SVG if the 'nodeName' of the first tag is "svg".
        if(isSvg === undefined){
            if(hasMultipleTagGroups){
                const allTagGroupsAreSvg = tagGroups.every(tg => /^<svg/.test(tg) === true)
                if(allTagGroupsAreSvg){
                    isSvg = true
                    svgDetected = true
                } else {
                    console.warn("the text has more than one tag-group, not all are starting with a svg-tag. the text will be parsed as html with svg if it contains any svg-tag (literally '<svg>' can't detect more by now).")
                    isSvg = false
                }
            }
            else if(hasSingleTagGroup) {
                if(nodeNameFirstTag === "svg"){
                    isSvg = true
                    svgDetected = true
                } else {
                    isSvg = false
                }
            }
        }
        // console.log("isSvg:", isSvg)
        // console.log("nodeNameFirstTag:", nodeNameFirstTag)
        // console.log("hasMultipleTagGroups:", hasMultipleTagGroups)
        // console.log("hasSingleTagGroup:", hasSingleTagGroup)
        // console.log("svgDetected:", svgDetected)

        // check if text has <svg>
        // > depends on 'isSvg'
        if(htmlWithSvg === undefined){
            if(!isSvg){
                htmlWithSvg = /<svg/.test(this.text)
            } else {
                htmlWithSvg = false
            }
        }
        // ------------------------------------------------------------------------------------------


        // add additional !independend! attributes
        // ------------------------------------------------------------------------------------------
        // check if a <svg> exist
        const hasSvg = (() => {
            return /<svg/.test(this.text)
        })()

        // check if multiple <svg> exist
        const hasMultipleSvgs = (() => {
            if(hasSvg){
                let matches = this.text.match(/<svg[^>]*>/g)
                return (matches !== null) ? (matches.length > 1) : false
            } else {
                return false
            }
        })()

        // if <svg> tag(s) exists 
        // - find out if a <foreignObject> tag exist
        // @todo: only if?
        const hasForeignObject = (() => {
            if(hasSvg || hasMultipleSvgs){
                return /<foreignObject/.test(this.text)
            } else {
                return false
            }
        })()

        // if <foreignObject> tag exists 
        // - find out if multiple <foreignObject> tags exist
        const hasMultipleForeignObjects = (() => {
            if(hasForeignObject){
                let matches = this.text.match(/<foreignObject[^>]*>/g)
                return (matches !== null) ? (matches.length > 1) : false
            } else {
                return false
            }
        })()
        // ------------------------------------------------------------------------------------------

        const addNamespaces = (() => {
            // namespace handling
            // force override specific xmlns attribute if it allready exists for 
            // 1. remove all xmlns attributes from 'svg' or 'foreignObject' or 'parent tag-group nodes'
            // 2. add xmlns attributes to 'svg' and 'foreignObject' and 'parent tag-group nodes'
            // match any attributes or none: ((\s[a-zA-Z_-]+=["'][^"']*["'])*)?
            // match xmlns attribute: (\sxmlns=["'][^"']*["'])
            // match to end of tag: ([^>]*>)
            // ------------------------------------------------------------------------------------------
            if(isSvg){
                if(hasMultipleTagGroups){
                    // only delete the xmlns attribute from the parent tag-group nodes
                    // i can need the tagGroups later, so i update them aswell
                    this.tagGroups = this.tagGroups.map(tg => tg.replace(/^(<[a-zA-Z]+[^>]*)(?:\sxmlns=["'][^"']*["'])/, `$1`))
                    this.tagGroups = this.tagGroups.map(tg => tg.replace(/^(<[a-zA-Z]+)/, `$1 xmlns="${XMLNS_SVG}"`))
                    this.text = this.tagGroups.join("")
                } else {
                    this.text = this.text.replace(/^(<[a-zA-Z]+(?:\s[^>]*)?)(\sxmlns=["'][^"']*["'])/, `$1`)
                    this.text = this.text.replace(/^(<([a-zA-Z]+))\b((?:[^>]*>.*?)(<\/\2>)+)/, `$1 xmlns="${XMLNS_SVG}"$3`)
                }
            }
            // @rule, imagine following NodeTemplate creation:
            // new NodeTemplate(`<g><foreignObject><div><svg></svg></div></foreignObject></g>`, { isSvg: true })
            // if i just check: if(!isSvg && hasSvg)
            // - the svg inside of the foreignObject tag would not get the correct xmlns attribute.
            // => theirfore use: if((!isSvg && hasSvg) || (isSvg && hasSvg))
            if((!isSvg && hasSvg) || (isSvg && hasSvg)){
                if(hasMultipleSvgs){
                    this.text = this.text.replace(/(<svg(?:\s[^>]*)?)(\sxmlns=["'][^"']*["'])/g, `$1`)
                    this.text = this.text.replace(/(<svg)\b((?:[^>]*>.*?)(<\/svg>)+)/g, `$1 xmlns="${XMLNS_SVG}"$2`)
                } else {
                    this.text = this.text.replace(/(<svg(?:\s[^>]*)?)(\sxmlns=["'][^"']*["'])/, `$1`)
                    this.text = this.text.replace(/(<svg)\b((?:[^>]*>.*?)(<\/svg>)+)/, `$1 xmlns="${XMLNS_SVG}"$2`)
                }
            }
            if(hasForeignObject){
                // GOT THE SUPER REGEX I SEARCHED FOR ABOVE HERE:
                // @BUGFIX: this does not apply to the tagGroups. maybe i should always change them and join them after as with isSvg && hasMultipleTagGroups!
                // (<foreignObject[^>]*><[a-zA-Z\d]+)((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?(\sxmlns=["'][^"']*["'])?((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?([^>]*>)
                // parts:
                // 1. match foreignObject tag including all parameters and its first child node opening tag: (<foreignObject[^>]*><[a-zA-Z\d]+)
                // 1.2.1 match any attributes but not 'xmlns': ((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?
                // 1.2.2 match 'xmlns' attribute if there is one: (\sxmlns=["'][^"']*["'])?
                // 1.2.3 match any attributes but not 'xmlns': ((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?
                // 1.3 match to the end of the fist child node opening tag: ([^>]*>)
                // > capturing group 3 is 'xmlns' if it allready exists.
                // > the idea behind excluding the allready existing 'xmlns' attribute is to force a custom attribute as first attribute of the tag!
                if(hasMultipleForeignObjects){
                    console.warn("Automated xmlns attribute for <foreignObject> content with multiple tag groups is not yet supported. Will only set xmlns for the first child of the <foreignObject>")
                    this.text = this.text.replace(/(<foreignObject[^>]*><[a-zA-Z\d]+)((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?(\sxmlns=["'][^"']*["'])?((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?([^>]*>)/g, `$1 xmlns="${XMLNS_FO}"$2$4$5`)
                } else {
                    this.text = this.text.replace(/(<foreignObject[^>]*><[a-zA-Z\d]+)((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?(\sxmlns=["'][^"']*["'])?((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?([^>]*>)/g, `$1 xmlns="${XMLNS_FO}"$2$4$5`)
                }
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
                if(tagGroups === undefined){
                    throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
                }
                this.fragment = window.document.createDocumentFragment()
                if(hasMultipleTagGroups){
                    // parse all tag groups and add all documentElements to the fragment
                    this.tagGroups.map(g => parser.parseFromString(g, "image/svg+xml")).forEach(d => this.fragment.appendChild(d.documentElement))
                } else {
                    // parse the tag group and add its documentElement to the fragment
                    this.fragment.appendChild(parser.parseFromString(this.text, "image/svg+xml").documentElement)
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
            else if(htmlWithSvg) {
                var ph = -1
                const placeHolderIdText = "nodetemplate-svg-placeholder-"
                const textWithPlaceholders = this.text.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, match =>{
                    ph += 1 // starts with zero
                    return `<div id="${placeHolderIdText}${ph}"></div>${match}`
                })
                const textWithoutSvgTagGroups = textWithPlaceholders.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, ``)
                const doc = parser.parseFromString(textWithoutSvgTagGroups, "text/html")
                const svgTagGroups = this.text.match(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g)
                if(svgTagGroups === null || svgTagGroups.length < 1){
                    throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
                }
                this.fragment = window.document.createDocumentFragment()
                Array.from(doc.body.childNodes).forEach(n => this.fragment.appendChild(n))
                svgTagGroups.map(g => parser.parseFromString(g, "image/svg+xml")).forEach((d, ph) => {
                    // QUERY SELECTOR ON FRAGMENT VS GETELEMENTBYID ON DOCUMENT?!
                    const placeHolderNode = this.fragment.querySelector(`#${placeHolderIdText}${ph}`)
                    placeHolderNode
                        .parentNode
                        .insertBefore(d.documentElement, placeHolderNode)
                    placeHolderNode
                        .parentNode
                        .removeChild(placeHolderNode)
                })
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

            // + `${  !isSvg && htmlWithSvg ?                                                   " containing"                       :   " without"  }` 
            // + `${  !isSvg && htmlWithSvg && !hasMultipleSvgs ?                               " multiple <svg> tags"              :   " a <svg> tag"  }` 
            // + `${  !isSvg && htmlWithSvg && hasForeignObject ?                               " with"                             :   " without"  } `
            // + `${  !isSvg && htmlWithSvg && hasForeignObject && hasMultipleForeignObjects ?  " multiple"                         :   " a"  }` 
            // + `${  !isSvg && htmlWithSvg && hasForeignObject && hasMultipleForeignObjects ?  " <foreignObject> tags."            :   " <foreignObject> tag."  }` 
        })()

        const createReferences = (() => {
            // add element references from 'data-tref' and 'id' attributes
            this.refs = {}
            this.ids = {}
            Array.from(this.fragment.childNodes).forEach(tagGroup => {
                iterate(tagGroup, n => {
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
                })
            })

            // add root reference
            this.root = (this.fragment.childNodes.length === 1)
                ? this.fragment.firstElementChild
                : Array.from(this.fragment.childNodes)
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
    html = html.replace(/\s{2,}/g, " ")
    
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

/**
 * The iterate function gets a node and a callback function... 
 * It starts iterating the dom from the node, recoursively executing the callback.
 * If the callback function itself does not call 'return', the iterate function
 * will return false after executing the recursion.
 */
const iterate = (n: Node, cb: Function) => {
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

