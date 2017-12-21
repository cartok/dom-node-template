import TAG_NAMES_HTML from "html-tag-names"
import TAG_NAMES_SVG from "svg-tag-names"

const MUTUAL_TAG_NAMES = TAG_NAMES_HTML.filter(n => TAG_NAMES_SVG.find(m => m === n) !== undefined)
const VALUES_TO_REMOVE = [ "svg", "image", "style", "script" ]
VALUES_TO_REMOVE.forEach(x => {
    const found = MUTUAL_TAG_NAMES.findIndex(y => x === y)
    MUTUAL_TAG_NAMES.splice(found, 1)
})

const DEFAULT_OPTIONS = {}

const XMLNS_SVG = "http://www.w3.org/2000/svg"
const XMLNS_XHTML = "http://www.w3.org/1999/xhtml"

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

const that = {
    hasMultipleTagGroups: new WeakMap(),
    hasSingleTagGroup: new WeakMap(),
}

export default class NodeTemplate {
    /**
     * 
     * @param {String}
     * @param {any}
     */
    constructor(tagText: String, options: Object) {
        
        // handle options
        // ------------------------------------------------------------------------------------------
        // typechecks
        if(typeof tagText !== "string"){
            throw new Error("you need to provide a xml string as first parameter.")
        }

        // merge default options
        options = Object.assign({}, DEFAULT_OPTIONS, options)
        let { svg } = options
        // ------------------------------------------------------------------------------------------
        
        
        // get all tag-groups
        // ------------------------------------------------------------------------------------------
        /**
         * SVGs can't just be parsed in the same way as HTML. 
         * If it is not done the right way, they would not be displayed.
         * SVGs must be parsed with the "image/svg+xml" option by the 'DOMParser'.
         * They also need to have a proper xmlns attribute set, before they get parsed.
         *  
         * If the text contains multiple SVG tag groups (or HTML and multiple SVG tag groups),
         * They need to get separated before being parsed, cause the 'DOMParser'
         * cannot parse multipla SVG tag groups at once, as with HTML, where it doesn't matter. 
         */
        this.text = cleanInputString(tagText)
        this.tagGroups = createTagGroupStrings(this.text)
        // that.hasMultipleTagGroups.set(this, this.tagGroups.length > 1)
        // that.hasSingleTagGroup.set(this, this.tagGroups.length === 1)
        // ------------------------------------------------------------------------------------------

        /*
            CSS positioning properties (e.g. top and margin) have no effect 
            when positioning the embedded content element in the SVG coordinate
            system. They can, however, be used to position child elements of
            a ‘foreignObject’ or HTML embedding element. 

            FOREIGN OBJECT RESEARCH RESULTS:
            @xmlns:     - foreignObject html tag groups need html namespace !!!!!
            @parsing:   - foreignObject html tags do not need a body element
            @parsing:   - foreignObject html tags can just be parsed as "image/svg+xml" !!!!!
            @xmlns:     - svg tag groups in an foreignObject, do not need a xmlns attribute
            @xmlns:     - svg tags in a html tag group in an foreignObject, need a xmlns attribute !!!!!
            @mutual:    - if foreignObject has a tag group with mututal tag name
                        => see "type detection"

            TEST CODE:
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                <foreignObject x="0" y="0" width="100" height="100">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="width:100px; height:100px; box-sizing: border-box; border: 2px solid red; position: static;">
                        <div style="width:100px; height:100px; background-color:blue; position: absolute;">
                            <div y="80" style="width:100%; height: 20px; background-color:yellow; position:relative; top:80px;"></div>
                        </div>
                    </div>
                </foreignObject>
            </svg>

            1. `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><foreignObject x="0" y="0" width="100" height="100"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100px; height:100px; box-sizing: border-box; border: 2px solid red; position: static;"><div style="width:100px; height:100px; background-color:blue; position: absolute;"><div y="80" style="width:100%; height: 20px; background-color:yellow; position:relative; top:80px;"></div></div></div></foreignObject></svg>`
                var p = new DOMParser()
                var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><foreignObject x="0" y="0" width="100" height="100"><div xmlns="http://www.w3.org/1999/xhtml" style="width:100px; height:100px; box-sizing: border-box; border: 2px solid red; position: static;"><div style="width:100px; height:100px; background-color:blue; position: absolute;"><div y="80" style="width:100%; height: 20px; background-color:yellow; position:relative; top:80px;"></div></div></div></foreignObject></svg>`
                var svgParsed = p.parseFromString(svg, "image/svg+xml").documentElement
                document.body.appendChild(svgParsed)
    
            2.1 `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100px; height:100px; box-sizing: border-box; border: 2px solid red; position: static;"><div style="width:100px; height:100px; background-color:blue; position: absolute;"><div y="80" style="width:100%; height: 20px; background-color:yellow; position:relative; top:80px;"></div></div></div>`
            2.2 `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><foreignObject x="0" y="0" width="100" height="100"></foreignObject></svg>`
                var p = new DOMParser()
                var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><foreignObject x="0" y="0" width="100" height="100"></foreignObject></svg>`
                var html = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100px; height:100px; box-sizing: border-box; border: 2px solid red; position: static;"><div style="width:100px; height:100px; background-color:blue; position: absolute;"><div y="80" style="width:100%; height: 20px; background-color:yellow; position:relative; top:80px;"></div></div></div>`
                var svgParsed = p.parseFromString(svg, "image/svg+xml").documentElement
                var htmlParsed = p.parseFromString(html, "text/html").body.firstElementChild
                document.body.appendChild(svgParsed)
                svgParsed.firstChild.appendChild(htmlParsed)
            

            <svg xmlns="http://www.w3.org/2000/svg">
                <foreignObject>
                    <div xmlns="http://www.w3.org/1999/xhtml"></div>
                    <div xmlns="http://www.w3.org/1999/xhtml"></div>
                </foreignObject>
            </svg>


            <svg xmlns="http://www.w3.org/2000/svg">
                <foreignObject>
                    <div xmlns="http://www.w3.org/1999/xhtml"></div>
                    <svg></svg>
                </foreignObject>
            </svg>


            <svg xmlns="http://www.w3.org/2000/svg">
                <foreignObject>
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        <svg xmlns="http://www.w3.org/2000/svg"></svg>
                    </div>
                </foreignObject>
            </svg>

            <svg xmlns="http://www.w3.org/2000/svg">
                <foreignObject>
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        <svg xmlns="http://www.w3.org/2000/svg">
                            <foreignObject>
                                <div xmlns="http://www.w3.org/1999/xhtml">
                                    <svg xmlns="http://www.w3.org/2000/svg">
                                        <foreignObject>
                                            <div xmlns="http://www.w3.org/1999/xhtml">
                                                <svg xmlns="http://www.w3.org/2000/svg">
                                                    <foreignObject>
                                                        <div xmlns="http://www.w3.org/1999/xhtml">
                                                            <svg xmlns="http://www.w3.org/2000/svg"></svg>
                                                        </div>
                                                    </foreignObject>
                                                </svg>
                                            </div>
                                        </foreignObject>
                                    </svg>
                                </div>
                            </foreignObject>
                        </svg>
                    </div>
                </foreignObject>
            </svg>

        */


        // tag group type detection
        // ------------------------------------------------------------------------------------------
        /**
         * Type detection:
         * ----------------------------------------------------------------------------------------------------
         * General idea: Distinguish between HTML and SVG by looking at the tag name.
         * Some tag names in HTML and SVG are mutual. They "exist in both".
         * For example the <a> Element exists in HTML and SVG, but in SVG it implements SVG interfaces aswell.
         * ====================================================================================================
         * Mutual tag names:
         * Distinguish between HTML and SVG and always provide a XMLNS-Attribute.
         * ====================================================================================================
         * 'audio'
         * 'canvas'
         * 'iframe'
         * 'video'
         * - HTML Embedded content 
         * => type: html
         * => xmlns: true
         * ----------------------------------------------------------------------------------------------------
         * 'a'
         * - if <a> is a tag group, warn the user that 'NodeTemplate' assumes it to be in the html namespace. 
         * => type: html
         * => xmlns: true
         * ----------------------------------------------------------------------------------------------------
         * 'font'
         * - mdn says the font element is deprecated, at least for html.
         * => type: svg
         * => xmlns: true
         * ----------------------------------------------------------------------------------------------------
         * 'title'
         * - the html title element is located in the head element, thus there will be no need to parse it as html.
         * => type: svg
         * => xmlns: true
         * ----------------------------------------------------------------------------------------------------
         * 'script'
         * 'style'
         * - Caution if a tag group is a <script> or <style> Element!
         * - It should be parsed as HTML!
         * - It does not need a xmlns attribute!
         * - It will be found under doc.head.firstChild!
         * => type: script|style
         * => xmlns: false
         */
        /**
            var p = new DOMParser()
            var svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="0" y="0" width="100" height="100"/></svg>`
            var html = `<style>rect { fill:red }</style>`
            var svgParsed = p.parseFromString(svg, "image/svg+xml").documentElement
            var htmlParsed = p.parseFromString(html, "text/html").head.firstChild      
            var fragment = document.createDocumentFragment()
			fragment.appendChild(htmlParsed)
			fragment.appendChild(svgParsed)
			document.body.appendChild(fragment)
         */
        /**
         * ====================================================================================================
         */

        // advance tag group information and parse:
        this.fragment = window.document.createDocumentFragment()
        this.tagGroups.forEach(tg => {
            console.log("adding tagGroup to the fragment:", tg)
            this.fragment.appendChild(tg)
        })
        console.log("finished fragment:", this.fragment)
        // ------------------------------------------------------------------------------------------
        

        // create node references
        // ------------------------------------------------------------------------------------------
        /*
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
        */
        // ------------------------------------------------------------------------------------------
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


// @todo: fix parenthesis spaces
// @feature: replace "" in attribute-values (css)
// @feature: remove comments
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
function createTagGroupStrings(tagText: String){
    // outer context
    const tagGroups: Array<String> = []

    // execute tag group creation
    while(tagText.length > 0){
        const firstTagName = getFirstTagName(tagText)
        if(firstTagName !== undefined){

            let tagGroupString = createTagGroupString(firstTagName, false)
            if(tagGroupString !== undefined){
                tagGroups.push(tagGroupString)
            } else {
                throw new Error("Function createTagGroupString() returned 'undefined'.")
            }
        } else {
            throw new Error("First Tag Name was 'undefined'.")
        }
    }

    // inner function 
    function createTagGroupString(firstTagName: String, debug: Boolean){
        
        let tagGroupString: String = ""
        
        let unclosedTagCnt = 0
        const unclosedTagExists = () => unclosedTagCnt !== 0
        
        const openingTagRegex = new RegExp(`^(<${firstTagName}(?:[^\\/>]*)(?:(?=((\\/)>))\\2|(?:>.*?(?=<\\/${firstTagName}|<${firstTagName}))))`)
        const closingTagRegex = new RegExp(`^(<\\/${firstTagName}>(?:.*?)(?=(?:<\\/${firstTagName})|(?:<${firstTagName}))|(?:<\\/${firstTagName}>))`)

        do{
            
            let openingTagMatches = undefined
            let closingTagMatches = undefined
                
            // 1. accumulate opening tags
            do {
                openingTagMatches = tagText.match(openingTagRegex)
                if(openingTagMatches !== null && openingTagMatches[0] !== undefined){
                    tagText = tagText.substring(openingTagMatches[0].length)
                    tagGroupString += openingTagMatches[0]
                    // no need to accumulate if the tag is a selfclosing tag 
                    if(openingTagMatches[2] === "/>"){
                        if(!unclosedTagExists()){
                            return tagGroupString
                        } else {
                            openingTagMatches = tagText.match(openingTagRegex)
                            continue
                        }
                    } else {
                        unclosedTagCnt += 1
                    }
                }
            } while(openingTagMatches !== null && openingTagMatches[0] !== undefined)

            // 2. accumulate closing tags
            do {
                closingTagMatches = tagText.match(closingTagRegex)
                if(closingTagMatches !== null && closingTagMatches[0] !== undefined){
                    tagText = tagText.substring(closingTagMatches[0].length)
                    tagGroupString += closingTagMatches[0]
                    unclosedTagCnt -= 1
                }
            } while(closingTagMatches !== null && closingTagMatches[0] !== undefined)

        } while(unclosedTagExists())
        
        return tagGroupString
    }

    // check result
    if(tagGroups.length < 1){
        throw new Error(`Could not create tag groups for '${tagText}'`)
    } else {
        return tagGroups
    }
}
function handleTagGroup(tagGroup: String, options: any){
    /* 
        worst tagGroup text cases:
        1.
        <div>
            <div></div>
            <svg>
                <svg></svg>
                <g>
                    <foreignObject>
                        <div></div>
                        <div></div>
                        <div>
                            <svg>
                                <g></g>
                                <foreignObject>

                                </foreignObject>
                            </svg>
                        </div>
                    </foreignObject>
                </g>
            </svg>
        </div>

        2.
        <foreignObject>
            <div></div>
            <div>
                <svg></svg>
            </div>
            <div></div>
        </foreignObject>

        3.
        <g>
            <foreignObject>
                <div></div>
                <div></div>
            </foreignObject>
        </g>

        CUT OUT FO or SVG:
        <tag>
            <tag></tag>
            <cut>
                <tag>
                    <cut></cut>
                </tag>
            </cut>
            <cut></cut>
            <tag></tag>
        </tag>
    */
    let { type, addXMLNS } = options

    // 1. analyze type
    if(type === undefined){
        let tagName = getFirstTagName(tagGroup)
        tagName = tagName.toLocaleLowerCase()

        addXMLNS = true
        type = undefined
        
        if(tagName === "div"){
            type = "html"
        } else if(tagName === "svg" || tagName === "g" || tagName === "foreignObject"){
            type = "svg"
        } else {
            if(MUTUAL_TAG_NAMES.includes(tagName)){
                switch(tagName){
                    // I. CONCRETE CASES:
                    // 1. Doesn't matter if it's handled as HTML or SVG, default: HTML. (not so concrete)
                    case "script":
                    case "style":
                        addXMLNS = false
                        type = "html"
                        break
                    // 2. Embedded Content has to be HTML.
                    case "audio":
                    case "canvas":
                    case "iframe":
                    case "video":
                        type = "html"
                        break
                    // II. INCONCRETE CASES:
                    // 1. Mutual tags, overridable default: SVG 
                    case "font":
                    case "title":
                        if(options.mutual.a.isHTML){
                            type = "html"
                        }
                        else {
                            type = "svg"
                            if(tagName === "title"){
                                warnAbout("title")
                            } else {
                                warnAbout("font")
                            }
                        }
                        break
                    // 2. Mutual tags, overridable default: HTML 
                    case "a":
                        if(options.mutual.a.isSVG){
                            type = "svg"
                        }
                        else {
                            type = "html"
                            warnAbout("a")
                        }
                        break
                }
                function warnAbout(t: String){
                    console.warn(`You provided an <${t}></${t}> tag as a tag-group (or root node, referring to the string input context).`)
                    console.warn(`The <${t}></${t}> tag exists in HTML and SVG namespace.`)
                    console.warn(`In this situation, as default, it will be handled like ${type.toUpperCase()}.`)
                    if(type === "html"){
                        console.warn(`It will have xmlns="http://www.w3.org/1999/xhtml" set, and parsed as "text/html" by the 'DOMParser'.`)
                        console.warn(`You can force SVG creation by passing a true set boolean at "options.mutual.a.isSVG", to the optional parameters object in the constructor call.`)
                        console.warn(`\nEXAMLPLE:`)
                        console.warn(`const svgContent = new NodeTemplate(\`<${t}></${t}>\`, { mutual: { ${t}: { isSVG: true } } })`)
                    } else if(type === "svg"){
                        console.warn(`It will have xmlns="http://www.w3.org/2000/svg" set, and parsed as "image/svg+xml" by the 'DOMParser'.`)
                        console.warn(`You can force HTML creation by passing a true set boolean at "options.mutual.a.isHTML", to the optional parameters object in the constructor call.`)
                        console.warn(`\nEXAMLPLE:`)
                        console.warn(`const htmlContent = new NodeTemplate(\`<${t}></${t}>\`, { mutual: { ${t}: { isHTML: true } } })`)
                    }
                } 
            } else {
                if(TAG_NAMES_HTML.includes(tagName)){
                    type = "html"
                } else if(TAG_NAMES_SVG.includes(tagName)){
                    type = "svg"
                } else {
                    throw new Error(`Could not detect type for tagName: ${tagName}.`)
                }
            }
        }
    }

    // 2. add xmlns
    if(addXMLNS){
        if(type === undefined) throw new Error("Something went wrong in type detection. Variable 'type' should not be undefined.")
        let XMLNS = undefined
        if(type === "html"){
            XMLNS = XMLNS_XHTML
        }
        else if (type === "svg"){
            XMLNS = XMLNS_SVG
        }
        // for the first tag replace existing xmlns or add xmlns 
        this.text = this.text.replace(/^(<[a-zA-Z]+(?:\s[^>]*)?)(\sxmlns=["'][^"']*["'])/, `$1`)
        this.text = this.text.replace(/^(<([a-zA-Z]+))\b((?:[^>]*>.*?)(<\/\2>)+)/, `$1 xmlns="${XMLNS}"$3`)
    }

    // 3. split or parse
    if(type === "html"){
        const SVGs = []
        let anchorIndex = 0
        let anchorId = `nodetemplate-svg-anchor-`
        while(containsSVG(tagGroup)){
            anchorId += anchorIndex
            let svgText = undefined
            tagGroup = tagGroup.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/, match => {
                svgText = match
                return `<a id="${anchorId}${anchorIndex}"></a>`   
            })
            anchorIndex++
            if(svgText !== null){
                let svgNode = handleTagGroup(svgText, { type: "svg" })
                if (svgNode === null || svgNode === undefined){
                    throw new Error("Could not parse SVG.")
                }
                SVGs.push(svgNode)
            } else {
                throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
            }
        }
        const HTMLDocument = parser.parseFromString(tagGroup, "text/html")
        SVGs.forEach((SVG, anchorIndex) => {
            const anchorNode = HTMLDocument.getElementById(`#${anchorId}${anchorIndex}`)
            anchorNode.parentNode.insertBefore(SVG, anchorNode)
            anchorNode.parentNode.removeChild(anchorNode)
        })
        console.log("finished HTMLDocument.")
        console.log(HTMLDocument)
        return HTMLDocument.body.firstElementChild
    }
    else if(type === "svg"){
        const EBContents = []
        let anchorIndex = 0
        let ebAnchorId = `nodetemplate-eb-anchor-`
        while(containsEB(tagGroup)){
            ebAnchorId += anchorIndex
            let ebText = undefined
            tagGroup = tagGroup.replace(/(<(?=audio||canvas||iframe||video)\1\b(?:[^>]*>.*?)(?:<\/\1>)+)/, match => {
                ebText = match
                return `<a id="${ebAnchorId}${anchorIndex}"></a>`   
            })
            anchorIndex++
                if(ebText !== null){
                let ebNode = handleTagGroup(ebText, { type: "html" })
                if (ebNode === null || ebNode === undefined){
                    throw new Error("Could not parse SVG.")
                }
                EBContents.push(ebNode)
            } else {
                throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
            }
        }

        let FOContents = []
        let anchorIndex = 0
        let foAnchorId = `nodetemplate-fo-content-anchor-`
        while(containsEB(tagGroup)){
            foAnchorId += anchorIndex
            let foContentText = undefined
            // regex actions:
            // 1. substring: 
            //      from:   start of first foreignObject content
            //      to:     end of first foreignObject content
            // .*?<foreignObject\b[^>]*>
            // OR just: 
            // 1. substring from first foreignObject content start
            // 2. substring from start to foreignObject end 
            // .*?</foreignObject>
            // POSSIBLE PROBLEMS: FO INSIDE FO!!!
            // @TODO: implement above
            // @TODO: add anchor element
            anchorIndex++
                if(foContentText !== null){
                FOContents = foContentText.map(tg => handleTagGroup(tg, { type: "html" }))
            } else {
                throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
            }
        }

        const SVGDocument = parser.parseFromString(tagGroup, "image/svg+xml")
        FOContents.forEach((FO, anchorIndex) => {
            const anchorNode = SVGDocument.getElementById(`#${foAnchorId}${anchorIndex}`)
            anchorNode.parentNode.insertBefore(FO, anchorNode)
            anchorNode.parentNode.removeChild(anchorNode)
        })
        EBContents.forEach((EB, anchorIndex) => {
            const anchorNode = SVGDocument.getElementById(`#${ebAnchorId}${anchorIndex}`)
            anchorNode.parentNode.insertBefore(EB, anchorNode)
            anchorNode.parentNode.removeChild(anchorNode)
        })
        console.log("finished SVGDocument.")
        console.log(SVGDocument)
        return SVGDocument.documentElement
    }
}

// helpers (constructor)
function getFirstTagName(tagText: String){
    let matches = tagText.match(/^<([a-zA-Z\d]+)/)
    return (matches !== null) ? matches[1] : undefined
}
function containsSVG(tagText: String){
    return /<svg/.test(tagText)
}
function containsFO(tagText: String){
    return /<foreignObject/.test(tagText)
}
function containsEB(tagText: String){
    return /<(?=audio||canvas||iframe||video)\1/.test(tagText)   
}
/**
 * The iterate function gets a node and a callback function... 
 * It starts iterating the dom from the node, recursively executing the callback.
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


// helpers (methods)
function getQueryType(query: String | Node){
    return  query instanceof Node ? "Node" : 
            query.charAt(0) === "." ? "id" : 
            query.charAt(0) === "#" ? "class" : "query"
}

