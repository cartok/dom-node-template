
// CORE CLEANUP BENCH: remove \n\r\t, replace 2 spaces with one.
// https://stackoverflow.com/questions/20056306/match-linebreaks-n-or-r-n
// windows: \r\n
// linux:   \n
// mac:     \r
// correct regex would be: \r\n|\r|\n
// but were writing the node template strings in linux i guess: [\n\t] is just all right.

// SETUP
var text = ".....https://........file:///.........//........"
var text = `
    // foo <bar></bar>
    <tag // single space
        attribute="value" // single space
        src="https://will-this-work?"        // random
        src="
            https://will-this-work?
        "
        src="https://will-this-work?" href="https://hodor-is-the-best" and="file:///home/cartok"    // works?
        > // single space
    </tag>
    <tag    // single tab
        attribute="value"   // single tab
        >    // single tab
    </tag>   // single tab
    <tag             // random
        attribute="value"         // random
        >            // random
    </tag>      // random
// newline
 // space
    // tab
           // random


`
// regex
text.replace(/\s*(?<![\:\/])\/{2}.*$/, "")

// string methods (split, map, join)
text.split("\n").map(line => {
	let position = line.indexOf("//")
    let found = (position !== -1)
    if(found){
        if(position > 0){
            // skip 'https://' and 'file:///'
            let precedingChar = line.charAt(position - 1)
            let followingChar = line.charAt(position + 2)
            let subPosition = null
            while(precedingChar === ":"){
                if(followingChar === "/"){
                    // continue search in substring
                    position += 3
                    subPosition = line.substring(position).indexOf("//")                
                } else {
                    // continue search in substring
                    position += 2
                    subPosition = line.substring(position).indexOf("//")                
                }
                found = (subPosition !== -1)
                if(found){
                    // repeat
                    position += subPosition
                    precedingChar = line.charAt(position - 1)
                    followingChar = line.charAt(position + 2)   
                } else {
                    // finish search
                    return line
                }
            }
        }
        // remove comment
        return line.substring(0, position)
    } else {
        return line
    }
}).join("\n")


// string methods (split, fast for)
var lines = text.split("\n")
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
text = lines.join("\n")


// string methods (substring \n iteration) --- not finished
var index = null
var line = null
var rest = text
var result = ""
do {
    index = rest.indexOf("\n")
    if(index !== -1){
        line = rest.substring(0, index)
        rest = rest.substring(index + 1)
    }
    console.log("line:", line)
    // - part 2
    let position = line.indexOf("//")
    let found = (position !== -1)
    if(found){
        if(position > 0){
            // skip 'https://' and 'file:///'
            let precedingChar = line.charAt(position - 1)
            let followingChar = line.charAt(position + 2)
            let subPosition = null
            while(precedingChar === ":"){
                if(followingChar === "/"){
                    // continue search in substring
                    position += 3
                    subPosition = line.substring(position).indexOf("//")                
                } else {
                    // continue search in substring
                    position += 2
                    subPosition = line.substring(position).indexOf("//")                
                }
                found = (subPosition !== -1)
                if(found){
                    // repeat
                    position += subPosition
                    precedingChar = line.charAt(position - 1)
                    followingChar = line.charAt(position + 2)   
                } else {
                    // while-loop: nothing found => finish search
                    break
                }
            }
            // for-loop: nothing found after detecting https:// or file:/// => next line
            if(!found){
                result += (line + "\n")
            }
        }
        // remove comment
        result += (line.substring(0, position) + "\n")
    }
} while(rest !== "")



var text = `
    <svg 
        class="bbox"
        >
        <g  
            data-ref="position-node" 
            transform="translate(0, 0)"
            >
            <g
                data-ref="container-node" 
                transform="translate(0, 0)"
                >
                
                <rect 
                    data-ref="collision-node" 
                    x="0" 
                    y="0" 
                    width="0" 
                    height="0" 
                    stroke="none" 
                    stroke-width="0"
                    fill="gray"
                    />

                <svg 
                    data-ref="border-node" 
                    x="0"
                    y="0"
                    width="0"
                    height="0"
                    >
                    <g 
                        data-ref="border-group" 
                        fill="black" 
                        stroke="none" 
                        stroke-width="0"
                        >
                        <polygon 
                            data-ref="border-top" 
                            points="0,0 0,0 0,0 0,0"
                            />
                        <polygon 
                            data-ref="border-right" 
                            points="0,0 0,0 0,0 0,0"
                            />
                        <polygon 
                            data-ref="border-bottom" 
                            points="0,0 0,0 0,0 0,0"
                            />
                        <polygon 
                            data-ref="border-left" 
                            points="0,0 0,0 0,0 0,0"
                            />
                    </g>
                </svg>

                <rect 
                    data-ref="cursor-node"
                    fill="transparent"
                    stroke="none"
                    stroke-width="0"
                    x="0"
                    y="0"
                    width="0"
                    height="0"
                    />
            </g>
        </g>
    </svg>

    <tag transform="translate(  1  ,  2  )
        translate (
            3,
            4
        )
        translate(        1px     ,       0px        )
        rotate(-0deg)
        scale(0.5, 0.5)"
        
        style="
                text-shadow: 1px 1px 2px black, 0 0 25px blue; color: rgba(200,
                300 ,  2,  .18 );
                text-shadow: 0 0 3px #FF0000, 0 0 5px #0000FF;
                background: url('img.gif
                ') right bottom no-repeat, url('img.gif') left top repeat;
                background: linear-gradient(to bottom,    #1e5799   0%,
                #2989d8 50%, #207cca  51%, #7db9e8 100%);"      >
    </tag>

    < tag > </ tag >

    <tag
        attribute="
            foo,
            bar,
            baz
        "
        >
`

// PREPARATION
const staticA = /[\n\t]/g
const staticB = /\s{2,}/g
const dynamicA = new RegExp("[\\n\\t]", "g")
const dynamicB = new RegExp("\\s{2,}", "g")

// TESTS
// replace, inline regex
text = text.replace(/[\n\t]/g, "")
text = text.replace(/\s{2,}/g, " ")

// replace, static regex
text = text.replace(staticA, "")
text = text.replace(staticB, " ")

// replace, dynamic regex
text = text.replace(dynamicA, "")
text = text.replace(dynamicB, " ")

// substring
// substring, substr and slice got equal performance.
var index = 0
while
(
	(index = text.indexOf("\n")) !== -1 ||
	(index = text.indexOf("\t")) !== -1 ||
    (index = text.indexOf("  ")) !== -1
){
    text = text.substring(0, index) + text.substring(index + 1)
}

// COMPLEX EXAMPLE
// substring
var index = 0
var found = false
var removeSpaceBeforeOffsetOne = false
var removeSpaceAfterOffsetTwo = false
var removeSpaceAfterOffsetThree = false
do {
    removeSpaceBeforeOffsetOne = (index = text.indexOf("\n")) !== -1
        || (index = text.indexOf("\t")) !== -1
        || (index = text.indexOf("  ")) !== -1
        || (index = text.indexOf(" <")) !== -1
        || (index = text.indexOf(" >")) !== -1
        || (index = text.indexOf(" />")) !== -1
        || (index = text.indexOf(" '")) !== -1
        || (index = text.indexOf(" \"")) !== -1
        || (index = text.indexOf(" (")) !== -1
        || (index = text.indexOf(" )")) !== -1
        || (index = text.indexOf(" ,")) !== -1
        || (index = text.indexOf(" ;")) !== -1
    if(removeSpaceBeforeOffsetOne){
        // target-offset = 1
        text = text.substring(0, index) + text.substring(index + 1)
    }

    removeSpaceAfterOffsetTwo = (index = text.indexOf("< ")) !== -1
        || (index = text.indexOf("> ")) !== -1
        || (index = text.indexOf("( ")) !== -1
        || (index = text.indexOf("= \"")) !== -1
    if(removeSpaceAfterOffsetTwo){
        // target-offset = 2
        text = text.substring(0, index + 1) + text.substring(index + 2)
    }

    removeSpaceAfterOffsetThree = (index = text.indexOf("</ ")) !== -1
        || (index = text.indexOf("=\" ")) !== -1
        || (index = text.indexOf(")\" >")) !== -1
    if(removeSpaceAfterOffsetThree){
        // target-offset = 3
        text = text.substring(0, index + 2) + text.substring(index + 3)
    }

    found = removeSpaceBeforeOffsetOne || removeSpaceAfterOffsetTwo || removeSpaceAfterOffsetThree
} while(found)


// regex
text = text.replace(/[\n\t]/g, "")
text = text.replace(/\s{2,}/g, " ")
text = text.replace(/;([^\s])/g, "; $1")
text = text.replace(/\s(">)/g, "$1")
text = text.replace(/>\s*</g, "><")
text = text.replace(/^(\s*)|(\s*)$/g, "")
text = text.replace(/>\s*/g, ">")
text = text.replace(/\s*</g, "<")
text = text.replace(/(<\w+)(\s{2,})/g, "$1 ")
text = text.replace(/([\w-_]+="[\w\s-_]+")(\s*(?!>))/g, "$1 ")
text = text.replace(/([\w-_]+="[\w\s-_]+")(\s{2,})>/g, "$1>")
