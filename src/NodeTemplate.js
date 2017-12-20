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
        that.hasMultipleTagGroups.set(this, this.tagGroups.length > 1)
        that.hasSingleTagGroup.set(this, this.tagGroups.length === 1)
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
        this.tagGroups.forEach(tagGroup => {

            let tagName = getFirstTagName(tagGroup)
            tagName = tagName.toLocaleLowerCase()

            // 1. analyze type
            let addXMLNS = true
            let type = undefined
            
            if(tagName === "svg" || tagName === "g"){
                type = "svg"
            } else if(tagName === "div"){
                type = "html"
            } else if(tagName === "foreignObject"){
                type = "fo"
            } else {
                if(MUTUAL_TAG_NAMES.includes(tagName)){
                    switch(tagName){
                        // I. CONCRETE CASES:
                        // 1. Doesn't matter if it's handled as HTML or SVG, default: HTML.
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
                    if(TAG_NAMES_SVG.includes(tagName)){
                        type = "svg"
                    } else if(TAG_NAMES_HTML.includes(tagName)){
                        type = "html"
                    } else {
                        throw new Error(`Could not detect type for tagName: ${tagName}.`)
                    }
                }
            }

            // 2. add xmlns
            if(addXMLNS){
                if(type === undefined) throw new Error("Something went wrong in type detection. Variable 'type' should not be undefined.")
                switch(type){
                    case "html":

                        break
                    case "svg":

                        break
                    case "fo":

                        break
                }
            }

            // 3. split or parse
            /* worst cases:
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
            switch(type){
                case "html":
                    // get all svgs
                    const svgs = undefined
                    const hasSVG = /<svg/.test(this.text)
                    const hasMultipleSVGs = (() => {
                        if(hasSVG){
                            let matches = this.text.match(/<svg[^>]*>/g)
                            return (matches !== null) ? (matches.length > 1) : false
                        } else {
                            return false
                        }
                    })()
                    // if its html with svg
                    // - add placeholder <div id="svg-X"></div> tag before the svgs
                    // - and cut out the whole svg to array (the text will have placeholders with ids instead of svgs)
                    // PROBLEM IF THE SVG IS INSIDE FOREIGN OBJECT.
                    // => go one by one. save to array, call 'analyzeSVG()' function each time
                    // => this function handles foreign object and calls itself if svgs are embedded in html in a foreign object etc.
                    //
                    // =>  
                    if(hasSVG) {
                        var ph = -1
                        const placeHolderIdText = "nodetemplate-svg-placeholder-"
                        const textWithPlaceholders = this.text.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, match =>{
                            ph += 1 // starts with zero
                            return `<div id="${placeHolderIdText}${ph}"></div>${match}`
                        })
                        const textWithoutSVGTagGroups = textWithPlaceholders.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, ``)
                        const svgTagGroups = this.text.match(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g)
                        if(svgTagGroups === null || svgTagGroups.length < 1){
                            throw new Error("you wanted to parse one or multiple svg-type tag-groups but something is wrong with your string. missing closing tag?")
                        }
                        /* dont parse yet
                        const doc = parser.parseFromString(textWithoutSVGTagGroups, "text/html")
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
                        */
                    }
                    // if it's just html
                    // no need to separate the tag-groups if its "text/html".
                    else {

                        // this.fragment = createDocumentFragment(this.text)
                    } 
                    break
                    do {
                        // in every html contains svg case

                    } 
                    while(containsSVG)              
                case "svg":
                    // get all foreignObjects
                    const foreignObjects = [{
                        fo: "",
                        tagGroups: [{}],
                    }]
                    const hasForeignObject = /<foreignObject/.test(tagGroup)
                    const hasMultipleForeignObjects = (() => {
                        if(hasForeignObject){
                            let matches = this.text.match(/<foreignObject[^>]*>/g)
                            return (matches !== null) ? (matches.length > 1) : false
                        } else {
                            return false
                        }
                    })()
                    if(hasForeignObject && !hasMultipleForeignObjects){
                            // ...
                    }    
                    do {
                        // in every svg case

                    }
                    while(containsFO)
                    break
                case "fo":
                    // ...
                    do {

                    } while(containsSVG)
                    break
            }


        })


        // ------------------------------------------------------------------------------------------
        

        // namespace handling
        // ------------------------------------------------------------------------------------------
        /*
            const addNamespaces = (() => {
                // force override specific xmlns attribute if it allready exists for 
                // 1. remove all xmlns attributes from 'svg' or 'foreignObject' or 'parent tag-group nodes'
                // 2. add xmlns attributes to 'svg' and 'foreignObject' and 'parent tag-group nodes'
                // match any attributes or none: ((\s[a-zA-Z_-]+=["'][^"']*["'])*)?
                // match xmlns attribute: (\sxmlns=["'][^"']*["'])
                // match to end of tag: ([^>]*>)
                // ------------------------------------------------------------------------------------------
                if(parseSVG){
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
                // new NodeTemplate(`<g><foreignObject><div><svg></svg></div></foreignObject></g>`, { parseSVG: true })
                // if i just check: if(!parseSVG && hasSVG)
                // - the svg inside of the foreignObject tag would not get the correct xmlns attribute.
                // => theirfore use: if((!parseSVG && hasSVG) || (parseSVG && hasSVG))
                if((!parseSVG && hasSVG) || (parseSVG && hasSVG)){
                    if(hasMultipleSVGs){
                        this.text = this.text.replace(/(<svg(?:\s[^>]*)?)(\sxmlns=["'][^"']*["'])/g, `$1`)
                        this.text = this.text.replace(/(<svg)\b((?:[^>]*>.*?)(<\/svg>)+)/g, `$1 xmlns="${XMLNS_SVG}"$2`)
                    } else {
                        this.text = this.text.replace(/(<svg(?:\s[^>]*)?)(\sxmlns=["'][^"']*["'])/, `$1`)
                        this.text = this.text.replace(/(<svg)\b((?:[^>]*>.*?)(<\/svg>)+)/, `$1 xmlns="${XMLNS_SVG}"$2`)
                    }
                }
                if(hasForeignObject){
                    // GOT THE SUPER REGEX I SEARCHED FOR ABOVE HERE:
                    // @BUGFIX: this does not apply to the tagGroups. maybe i should always change them and join them after as with parseSVG && hasMultipleTagGroups!
                    // (<foreignObject[^>]*><[a-zA-Z\d]+)((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?(\sxmlns=["'][^"']*["'])?((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?([^>]*>)
                    // parts:
                    // 1. match foreignObject tag including all parameters and its first child node opening tag: (<foreignObject[^>]*><[a-zA-Z\d]+)
                    // 1.2.1 match any attributes but not 'xmlns': ((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?
                    // 1.2.2 match 'xmlns' attribute if there is one: (\sxmlns=["'][^"']*["'])?
                    // 1.2.3 match any attributes but not 'xmlns': ((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?
                    // 1.3 match to the end of the fist child nall:ode opening tag: ([^>]*>)
                    // > capturing group 3 is 'xmlns' if it allready exists.
                    // > the idea behind excluding the allready existing 'xmlns' attribute is to force a custom attribute as first attribute of the tag!
                    if(hasMultipleForeignObjects){
                        console.warn("Automated xmlns attribute for <foreignObject> content with multiple tag groups is not yet supported. Will only set xmlns for the first child of the <foreignObject>")
                        this.text = this.text.replace(/(<foreignObject[^>]*><[a-zA-Z\d]+)((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?(\sxmlns=["'][^"']*["'])?((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?([^>]*>)/g, `$1 xmlns="${XMLNS_FO}"$2$4$5`)
                    } else {
                        this.text = this.text.replace(/(<foreignObject[^>]*><[a-zA-Z\d]+)((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?(\sxmlns=["'][^"']*["'])?((?:\s(?!xmlns)[a-zA-Z_-]+=["'][^"']*["'])*)?([^>]*>)/g, `$1 xmlns="${XMLNS_FO}"$2$4$5`)
                    }
                }
            })()
            */
        // ------------------------------------------------------------------------------------------
        

        // parsing
        // ------------------------------------------------------------------------------------------
        /*
            const parse = (() => {
                this.fragment = undefined
                // if it's svg
                // - check if multiple tag-groups
                // - create a SVGDocument for each tag-group
                // - append its documentElement to a new DocumentFragment
                if(parseSVG){
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
                else if(htmlWithSVG) {
                    var ph = -1
                    const placeHolderIdText = "nodetemplate-svg-placeholder-"
                    const textWithPlaceholders = this.text.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, match =>{
                        ph += 1 // starts with zero
                        return `<div id="${placeHolderIdText}${ph}"></div>${match}`
                    })
                    const textWithoutSVGTagGroups = textWithPlaceholders.replace(/(<svg\b(?:[^>]*>.*?)(?:<\/svg>)+)/g, ``)
                    const doc = parser.parseFromString(textWithoutSVGTagGroups, "text/html")
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
            })()
        */
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
function getFirstTagName(tagText: String){
    let matches = tagText.match(/^<([a-zA-Z\d]+)/)
    return (matches !== null) ? matches[1] : undefined
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

    // inner function that can use the outer context
    function createTagGroupString(firstTagName: String, debug: Boolean){
        
        let tagGroupString: String = "" // not needed if using recursion.
        
        let unclosedTagCnt = 0
        const unclosedTagExist = () => unclosedTagCnt !== 0
        
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
                        if(!unclosedTagExist()){
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

        } while(unclosedTagExist())
        
        return tagGroupString
    }

    // check result
    if(tagGroups.length < 1){
        throw new Error(`Could not create tag groups for '${tagText}'`)
    } else {
        return tagGroups
    }
}

function getQueryType(query: String | Node){
    return  query instanceof Node ? "Node" : 
            query.charAt(0) === "." ? "id" : 
            query.charAt(0) === "#" ? "class" : "query"
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

