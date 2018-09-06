import TAG_NAMES_HTML from "html-tag-names"
import TAG_NAMES_SVG from "svg-tag-names"

const MUTUAL_TAG_NAMES = TAG_NAMES_HTML.filter(n => TAG_NAMES_SVG.find(m => m === n) !== undefined)
const VALUES_TO_REMOVE = [ "svg", "image", "style", "script" ]
VALUES_TO_REMOVE.forEach(x => {
    const found = MUTUAL_TAG_NAMES.findIndex(y => x === y)
    MUTUAL_TAG_NAMES.splice(found, 1)
})

const DEFAULT_OPTIONS = {
}

const XMLNS_SVG = "http://www.w3.org/2000/svg"
const XMLNS_XHTML = "http://www.w3.org/1999/xhtml"

const parser = new window.DOMParser()
const createDocumentFragment = (window !== undefined && window.document !== undefined && window.document.createRange !== undefined)
    ? (tagText: String) => window.document.createRange().createContextualFragment(tagText)
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
        
        // parameter typechecks
        if(typeof tagText !== "string"){
            throw new Error("you need to provide a xml string as first parameter.")
        }

        // merge default options
        options = Object.assign({}, DEFAULT_OPTIONS, options)
        let { svg } = options
        
        // prepare input string
        this.text = cleanInputString(tagText, { removeComments: true })
        this.tagGroups = getTagGroups(this.text)
        // console.log("tagGroups:", this.tagGroups)

        // parse
        this.fragment = window.document.createDocumentFragment()
        this.tagGroups.forEach(tg => {
            const tagGroupNode = handleTagGroup(tg)
            // console.log("adding tagGroup to the fragment:", tagGroupNode)
            this.fragment.appendChild(tagGroupNode)
        })
        // console.log("finished fragment:", this.fragment)
    
        // create node references
        const createReferences = (() => {
            // add element references from 'data-tref' and 'id' attributes
            this.refs = {}
            this.ids = {}
            Array.from(this.fragment.childNodes).forEach(tagGroup => iterate(tagGroup, n => {
                // add data-ref references
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
            }))

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



// @todo: fix parenthesis spaces
// @feature: replace "" in attribute-values (css)
function cleanInputString(tagText: String, options: any): String {
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
    
    if(removeComments){
        // tagText = tagText.replace()
    }
    if(replaceAttributeValueQuotes){
        // tagText = tagText.replace()
    }

    // console.log("cleaned tagText string:", tagText)
    return tagText
}
/*
    
    <div></div>
    <foreignObject>
        <div></div>
        <div></div>
        <div>
            <svg>
                <foreignObject></foreignObject>
            </svg>
        </div>
    </foreignObject>
    <div></div>

*/
/**
 * The function will return the next tag with the provided 'tagName'.
 * 
 * @param {*} text 
 * @param {*} tagName  
 * @param {*} getTagContent 
 */
function getTagGroupByName(text: String, tagName: String, getTagContent: Boolean): any {
        // console.log("-----------------------------------------")
        // console.log("             getTagGroupByName           ")
        // console.log("-----------------------------------------")
        // console.log("text:", text)
        let tagGroup = ""
        let content = ""
        let startIndex = undefined
        let endIndex = undefined
        let contentStartIndex = undefined
        let contentEndIndex = undefined

        let unclosedTagCnt = 0
        const unclosedTagExists = () => unclosedTagCnt !== 0

        const openingTagRegex = new RegExp(`^(<${tagName}(?:[^\\/>]*)?(?:(?=((\\/)>))\\2|(?:>.*?(?=<\\/${tagName}|<${tagName}))))`)
        const closingTagRegex = new RegExp(`^(<\\/${tagName}>(?:.*?)(?=(?:<\\/${tagName})|(?:<${tagName}))|(?:<\\/${tagName}>))`)

        // go to start of the first tag:
        const textBeforeStart = text.match(/(.*?)(?=<foreignObject)/)
        startIndex = textBeforeStart[0].length
        text = text.substring(startIndex)
        // console.log("cut text:", text)

        // accumulate tag group
        do {
            let openingTagMatches = undefined
            let closingTagMatches = undefined
            // 1. accumulate opening tags
            do {
                openingTagMatches = text.match(openingTagRegex)
                // console.log("opening tag match:", openingTagMatches)
                if(openingTagMatches !== null && openingTagMatches[0] !== undefined){
                    text = text.substring(openingTagMatches[0].length)
                    tagGroup += openingTagMatches[0]
                    // no need to accumulate if the tag is a selfclosing tag 
                    if(openingTagMatches[2] === "/>"){
                        if(!unclosedTagExists()){
                            return tagGroup
                        } else {
                            continue
                        }
                    } else {
                        unclosedTagCnt += 1
                    }
                }
            } while(openingTagMatches !== null && openingTagMatches[0] !== undefined)
            // 2. accumulate closing tags
            do {
                closingTagMatches = text.match(closingTagRegex)
                if(closingTagMatches !== null && closingTagMatches[0] !== undefined){
                    text = text.substring(closingTagMatches[0].length)
                    tagGroup += closingTagMatches[0]
                    unclosedTagCnt -= 1
                }
            } while(closingTagMatches !== null && closingTagMatches[0] !== undefined)
        } while(unclosedTagExists())
        // console.log("accumulated tag group:", tagGroup)

        // add endIndex to be able to cut the group after extracting it.
        endIndex = startIndex + tagGroup.length

        // remove first opening and last closing tag from accumulated tag group
        // PROBLEM: tagGroup is just a self closing tag, without content
        // PROBLEM: tagGroup has no content
        if(getTagContent){
            const firstOpeningTagRegex = new RegExp(`^<${tagName}(?:[^\\/>]*)?(\\/)?>`)
            const lastClosingTagRegex = new RegExp(`<\\/${tagName}>$`)
            const firstOpeningTagMatch = tagGroup.match(firstOpeningTagRegex)
            const lastClosingTagMatch = tagGroup.match(lastClosingTagRegex)
            // if the tag group is a self closing tag, it has no content.
            if(firstOpeningTagMatch[1] === "/"){
                console.warn("A selfclosing tag has no content.")
                content = ""
            } else {
                content = tagGroup.substring(firstOpeningTagMatch[0].length, lastClosingTagMatch.index)
            }
            contentStartIndex = firstOpeningTagMatch[0].length
            contentEndIndex = lastClosingTagMatch.index
        }

        if(getTagContent){
           return { tagGroup, startIndex, endIndex, content, contentStartIndex, contentEndIndex }
        } else {
           return { tagGroup, startIndex, endIndex }
        }
}
function getTagGroups(tagText: String){
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
                throw new Error("createTagGroupString(firstTagName) returned 'undefined'.")
            }
        } else {
            console.log(tagText)
            throw new Error("firstTagName is 'undefined'. You must have an error in your 'tagText'. Are you missing a closing tag?")
        }
    }

    // inner function that can use the outer context
    function createTagGroupString(firstTagName: String, debug: Boolean){
        
        let tagGroupString = ""
        
        let unclosedTagCnt = 0
        const unclosedTagExist = () => unclosedTagCnt !== 0
        
        const openingTagRegex = new RegExp(`^(<${firstTagName}(?:[^\\/>]*)(?:(?=((\\/)>))\\2|(?:>.*?(?=<\\/${firstTagName}|<${firstTagName}))))`)
        const closingTagRegex = new RegExp(`^(<\\/${firstTagName}>(?:.*?)(?=(?:<\\/${firstTagName})|(?:<${firstTagName}))|(?:<\\/${firstTagName}>))`)
        const lastClosingTagRegex = new RegExp(`^(<\/${firstTagName}[^>]*?>)`)

        do { 
            let openingTagMatches = undefined
            let closingTagMatches = undefined
                
            // 1. accumulate opening tags
            do {
                openingTagMatches = tagText.match(openingTagRegex)
                if(openingTagMatches !== null && openingTagMatches[0] !== undefined){
                    tagText = tagText.substring(openingTagMatches[0].length)
                    tagGroupString += openingTagMatches[0]
                    // no need to accumulate if the tag is a selfclosing tag 
                    if(openingTagMatches[2] === "/>" && !unclosedTagExist()){
                        return tagGroupString
                    } else {
                        unclosedTagCnt += 1
                    }
                }
            } while(openingTagMatches !== null && openingTagMatches[0] !== undefined)

            // 2. accumulate closing tags
            do {
                // console.log("tagText:", tagText)
                closingTagMatches = (unclosedTagCnt === 1) 
                    ? tagText.match(lastClosingTagRegex)
                    : tagText.match(closingTagRegex)
                if(closingTagMatches !== null && closingTagMatches[0] !== undefined){
                    tagText = tagText.substring(closingTagMatches[0].length)
                    tagGroupString += closingTagMatches[0]
                    unclosedTagCnt -= 1
                }
            } while(closingTagMatches !== null && closingTagMatches[0] !== undefined)

        } while(unclosedTagExist())
        
        return tagGroupString
    }

    // check result
    if(tagGroups.length < 1){
        throw new Error(`Could not create tag groups for "${tagText}". See the 'tagGroups': ${tagGroups}.`)
    } else {
        return tagGroups
    }
}



const SVGAnchorId = `nodetemplate-svg-anchor`
const EBAnchorId = `nodetemplate-eb-anchor`
const FOAnchorId = `nodetemplate-fo-anchor`
const FOContentAnchorId = `nodetemplate-fo-content-anchor-`
function handleTagGroup(tagGroup: String, options: any): Node {
    let SVGAnchorIndex = 0
    let EBAnchorIndex = 0
    let FOAnchorIndex = 0
    // console.log("-----------------------------------------")
    // console.log("             handleTagGroup              ")
    // console.log("-----------------------------------------")
    // console.log("tagGroup:", tagGroup)
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
    options = Object.assign({}, options)
    let { type, addXMLNS } = options

    // 1. analyze type
    // console.log("type:", type)
    if(type === undefined){
        let tagName = getFirstTagName(tagGroup)

        addXMLNS = true
        type = undefined

        if(tagName === "div"){
            type = "html"
        } else if(tagName === "svg" || tagName === "g" || tagName === "foreignObject"){
            type = "svg"
        } else if(MUTUAL_TAG_NAMES.includes(tagName)){
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
        } else if(TAG_NAMES_HTML.includes(tagName)){
            type = "html"
        } else if(TAG_NAMES_SVG.includes(tagName)){
            type = "svg"
        } else {
            throw new Error(`Could not detect type for tagName: ${tagName}.`)
        }
    }
    // console.log("type:", type)

    // 2. add xmlns
    if(addXMLNS === undefined){
        addXMLNS = true
    }
    // console.log("addXMLNS:", addXMLNS)
    if(addXMLNS){
        if(type === undefined) throw new Error("Something went wrong in type detection. Variable 'type' should not be undefined.")
        let XMLNS = (type === "html") ? XMLNS_XHTML : XMLNS_SVG
        // for the first tag replace existing xmlns
        tagGroup = tagGroup.replace(/^(<[a-zA-Z]+(?:\s[^>]*)?)(\sxmlns=["'][^"']*["'])/, `$1`)
        tagGroup = tagGroup.replace(/^(<([a-zA-Z]+))\b((?:[^>]*>.*?)(<\/\2>)+)/, `$1 xmlns="${XMLNS}"$3`)
    }
    // console.log("tagGroup after xmlns:", tagGroup)
        
    // 3. split or parse
    if(type === "html"){
        const SVGNodes = []
        while(containsSVG(tagGroup)){
            let SVGText = undefined
            tagGroup = tagGroup.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/, match => {
                SVGText = match
                return `<a id="${SVGAnchorId}-${SVGAnchorIndex}"></a>`   
            })
            if(SVGText !== null){
                SVGAnchorIndex++
                let SVGNode = handleTagGroup(SVGText, { type: "svg" })
                if (SVGNode === null || SVGNode === undefined){
                    throw new Error("Could not parse SVG.")
                }
                SVGNodes.push(SVGNode)
            } else {
                throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
            }
        }
        const HTMLDocument = parser.parseFromString(tagGroup, "text/html")
        SVGNodes.forEach((SVG, idx) => {
            const anchorNode = HTMLDocument.getElementById(`${SVGAnchorId}-${idx}`)
            anchorNode.parentNode.insertBefore(SVG, anchorNode)
            anchorNode.parentNode.removeChild(anchorNode)
        })
        // console.log("finished HTMLDocument.")
        // console.log("content:", HTMLDocument.body.firstElementChild)
        return HTMLDocument.body.firstElementChild
    }
    else if(type === "svg"){
        const EBNodes = []
        while(containsEB(tagGroup) && !/audio|canvas|iframe|video/.test(getFirstTagName(tagGroup))){
            let EBText = ""
            tagGroup = tagGroup.replace(/<(?=(audio|canvas|iframe|video))\1\b(?:[^>]*>.*?)(?:<\/\1>)+/, match => {
                EBText = match
                return `<a id="${EBAnchorId}-${EBAnchorIndex}"></a>`   
            })
            EBAnchorIndex++
            if(EBText !== null){
                let EBNode = handleTagGroup(EBText, { type: "html" })
                if (EBNode === null || EBNode === undefined){
                    throw new Error("Could not parse Embedded Content.")
                }
                EBNodes.push(EBNode)
            } else {
                throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
            }
        }

        const FONodes = []
        const FOContentNodes = []
        while(containsFO(tagGroup) && getFirstTagName(tagGroup) !== "foreignObject"){
            /*
                <rect/><foreignObject><div><h1>jo</h1></div></foreignObject><rect/><foreignObject>something</foreignObject>
                becomes: {
                    tagGroup: "<foreignObject><div><h1>jo</h1></div></foreignObject>",
                    startIndex: 7,
                    endIndex: 49,
                    content: "<div><h1>jo</h1></div>",
                    contentStartIndex: 22,
                    contentEndIndex: 33,
                }
                => FONodes = [ "<foreignObject><a id="fo-content-0"></a></foreignObject>" ]
                => FOContentNodes = [ "<div><h1>jo</h1></div>" ]
                => <rect/><a id="fo-0"><rect/><foreignObject>something</foreignObject>
                                              | -> this will be the next foreign object cause foreignObjectExists()
                THEN:
                if no more foreign objects exist:
                - parse svg
                - add parsed foreignObjects => parse as svg
                - add parsed foreignObject content to foreignObjects => handleTagGroup() 
            */
            let fo = getTagGroupByName(tagGroup, "foreignObject", true)
            
            // remove fo and add replacement anchor
            // console.log("tagGroup before remove fo:", tagGroup)
            tagGroup = tagGroup.substring(0, fo.startIndex) + tagGroup.substring(fo.endIndex)
            // console.log("tagGroup after remove fo:", tagGroup)
            const beforeFO = tagGroup.slice(0, fo.startIndex)
            const afterFO = tagGroup.slice(fo.startIndex)
            tagGroup = beforeFO.concat(`<a id="${FOAnchorId}-${FOAnchorIndex}"></a>`).concat(afterFO)
            // console.log("tagGroup after add anchor:", tagGroup)
        
            // remove fo content and add replacement anchor 
            const beforeFOContent = fo.tagGroup.slice(0, fo.contentStartIndex)
            const afterFOContent = fo.tagGroup.slice(fo.contentEndIndex)
            fo.tagGroup = beforeFOContent.concat(`<a id="${FOContentAnchorId}-${FOAnchorIndex}"></a>`).concat(afterFOContent)
            // parse fo
            FONodes.push(handleTagGroup(fo.tagGroup, { type: "svg" }))
            // parse fo contents
            // console.log("fo:", fo)
            if(fo.content.length !== 0){
                // console.log("calling getTagGroups with fo.content:", fo.content)
                const FOContentTexts = getTagGroups(fo.content)
                FOContentNodes.push(FOContentTexts.map(tg => handleTagGroup(tg, { type: "html" })))
                FOAnchorIndex++
            }
        }

        // parse svg
        // console.log("parsing SVG:", tagGroup)
        const SVGDocument = parser.parseFromString(tagGroup, "image/svg+xml")
        // console.log(SVGDocument)
        // add fos 
        FONodes.forEach((FO, idx) => {
            const anchorNode = SVGDocument.getElementById(`${FOAnchorId}-${idx}`)
            anchorNode.parentNode.insertBefore(FO, anchorNode)
            anchorNode.parentNode.removeChild(anchorNode)
        })
        // add foContents
        FOContentNodes.forEach((FOContent, idx) => {
            const anchorNode = SVGDocument.getElementById(`${FOContentAnchorId}-${idx}`)
            const fragment = window.document.createDocumentFragment()
            FOContent.forEach(x => fragment.appendChild(x))
            anchorNode.parentNode.insertBefore(fragment, anchorNode)
            anchorNode.parentNode.removeChild(anchorNode)
        })
        // add ebs
        EBNodes.forEach((EB, idx) => {
            const anchorNode = SVGDocument.getElementById(`${EBAnchorId}-${idx}`)
            anchorNode.parentNode.insertBefore(EB, anchorNode)
            anchorNode.parentNode.removeChild(anchorNode)
        })
        // console.log("finished SVGDocument.")
        // console.log("content:", SVGDocument.documentElement)
        return SVGDocument.documentElement
    }
}

// helpers (constructor)
function getFirstTagName(tagText: String): String {
    // console.log("tagText:", tagText)
    let matches = tagText.match(/^<([a-zA-Z\d]+)/)
    return (matches !== null) ? matches[1] : undefined
}
function containsSVG(tagText: String): Boolean {
    return /<svg/.test(tagText)
}
function containsFO(tagText: String): Boolean {
    return /<foreignObject/.test(tagText)
}
function containsEB(tagText: String): Boolean {
    return /<(?=(audio|canvas|iframe|video))\1/.test(tagText)   
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
function getQueryType(query: String | Node): String {
    return  query instanceof Node ? "Node" : 
            query.charAt(0) === "." ? "id" : 
            query.charAt(0) === "#" ? "class" : "query"
}

