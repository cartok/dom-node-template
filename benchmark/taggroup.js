// https://jsperf.com/xml-tag-groups-from-string-iterative-vs-recursive-2
var Benchmark = require("./benchmark")

var text = `
    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
        <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
            <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
                <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                </div>
            </div>
        </div>
    </div>
    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
        <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
            <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
                <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
                </div>
            </div>
        </div>
    </div>
    <div xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx></div>
`
text = cleanInputString(text)
function cleanInputString(html){
    
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
function createTagGroupStrings_iterative(tagText){
    // outer context
    const tagGroups = []

    // execute tag group creation
    while(tagText.length > 0){
        const firstTagName = (() => {
            let matches = tagText.match(/^<([a-zA-Z\d]+)/)
            return (matches !== null) ? matches[1] : undefined
        })()
        let tagGroupString = createTagGroupString(firstTagName, false)
        if(tagGroupString !== undefined){
            tagGroups.push(tagGroupString)
        } else {
            throw new Error("Function createTagGroupString() returned 'undefined'.")
        }
    }

    function createTagGroupString(firstTagName, debug){
        
        let tagGroupString = ""
        
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
function createTagGroupStrings_recursive(tagText, array = []){
    if(tagText.length > 0){
        const firstTagName = (() => {
            let matches = tagText.match(/^<([a-zA-Z\d]+)/)
            return (matches !== null) ? matches[1] : undefined
        })()
        array.push(createGroup(tagText, firstTagName))
        return createTagGroupStrings_recursive(tagText.substr(array[array.length-1].length), array)
    } else {
        return array
    }
    function createGroup(text, tagName, tagStr = "", unclosed = undefined){
        const openingTagRegex = new RegExp(`^(<${tagName}(?:[^\\/>]*)(?:(?=((\\/)>))\\2|(?:>.*?(?=<\\/${tagName}|<${tagName}))))`)
        const closingTagRegex = new RegExp(`^(<\\/${tagName}>(?:.*?)(?=(?:<\\/${tagName})|(?:<${tagName}))|(?:<\\/${tagName}>))`)
        const unclosedTagExist = () => unclosed !== 0
        
        if(!unclosedTagExist()){
            // finish recursion
            return tagStr
        } else {
            unclosed = (unclosed === undefined) ? 0 : unclosed
            // 1. accumulate opening tags
            let openMatch = text.match(openingTagRegex)
            if(openMatch !== null && openMatch[0] !== undefined){
                // no need to accumulate if the tag is a selfclosing tag 
                if(openMatch[2] === "/>"){
                    if(!unclosedTagExist()){
                        return openMatch[0]
                    } else {
                        return tagStr + createGroup(text.substr(openMatch[0].length), tagName, openMatch[0], unclosed)
                    }
                } 
                else {
                    return tagStr + createGroup(text.substr(openMatch[0].length), tagName, openMatch[0], ++unclosed)
                }
            }
            
            // 2. accumulate closing tags
            let closeMatch = text.match(closingTagRegex)
            if(closeMatch !== null && closeMatch[0] !== undefined){
                return tagStr + createGroup(text.substr(closeMatch[0].length), tagName, closeMatch[0], --unclosed)
            }
        }
    }
}

const suite = new Benchmark.Suite;

// add tests 
suite
.add('iterative', createTagGroupStrings_iterative(text))
.add('recursive', createTagGroupStrings_recursive(text))
.on('cycle', function(event) {
    console.log(String(event.target))
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
})
.run({ 'async': false })