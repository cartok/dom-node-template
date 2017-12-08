// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

/*
REGEX PLAYGROUND: 
<div><div></div><div><div><div></div></div></div><div></div></div>

open:  ^(<div(?:[^\/>]*)(?:(?=((\/)>))\2|(?:>.*?(?=<\/div|<div))))
close: ^(<\/div>(?:.*?)(?=(?:<\/div)|(?:<div))|(?:<\/div>))

<div> 					    open
    <div></div> 		    open, close
    <div> 				    open 
        <div> 			    open
            <div></div>     open, close
        </div> 			    close
    </div> 				    close
    <div></div> 		    open, close
</div> 					    close


*/
const nt1 = new NodeTemplate(`<div></div>`)
console.log("\nnt1:", nt1)

const nt2 = new NodeTemplate(`<div/>`)
console.log("\nnt2:", nt2)

const nt3 = new NodeTemplate(`
    <div></div>
    <div></div>
    <div/>
`)
console.log("\nnt3:", nt3)

const nt4 = new NodeTemplate(`
    <div>
        <div></div>
    </div>
`)
console.log("\nnt4:", nt4)

const nt5 = new NodeTemplate(`
    <div>
        <div></div>
        <div>
            <div>
                <div></div>
            </div>
        </div>
        <div></div>
    </div>
`)
console.log("\nnt5:", nt5)

const nt6 = new NodeTemplate(`
    <div></div>
    <div>
        <div></div>
    </div>
    <div></div>
`)
console.log("\nnt6:", nt6)

const nt7 = new NodeTemplate(`
    <div>
        <div/>
    </div>
`)
console.log("\nnt7:", nt7)

const ntx = new NodeTemplate(`
    <g id="1.0">
        <g id="1.1"></g>
        <rect></rect>
    </g>
    <div id="2.0"></div>
`)
console.log("ntx:")
console.log(ntx)







// FOR JSPERF:
// const text = `
// <div></div><div></div><div></div><div></div><div></div><div></div><div></div>
// <div></div><div></div><div></div><div></div><div></div><div></div><div></div>
// <div></div><div></div><div></div><div></div><div></div><div></div><div></div>
// `


// function createTagGroupStrings_iterative(tagText){
//     // outer context
//     const tagGroups = []

//     // execute tag group creation
//     while(tagText.length > 0){
//         const firstTagName = (() => {
//             let matches = tagText.match(/^<([a-zA-Z\d]+)/)
//             return (matches !== null) ? matches[1] : undefined
//         })()
//         let tagGroupString = createTagGroupString(firstTagName, false)
//         if(tagGroupString !== undefined){
//             tagGroups.push(tagGroupString)
//         } else {
//             throw new Error("Function createTagGroupString() returned 'undefined'.")
//         }
//     }

//     function createTagGroupString(firstTagName, debug){
        
//         let tagGroupString = ""
        
//         let unclosedTagCnt = 0
//         const unclosedTagExist = () => unclosedTagCnt !== 0
        
//         const openingTagRegex = new RegExp(`^(<${firstTagName}(?:[^\\/>]*)(?:(?=((\\/)>))\\2|(?:>.*?(?=<\\/${firstTagName}|<${firstTagName}))))`)
//         const closingTagRegex = new RegExp(`^(<\\/${firstTagName}>(?:.*?)(?=(?:<\\/${firstTagName})|(?:<${firstTagName}))|(?:<\\/${firstTagName}>))`)

//         do{
            
//             let openingTagMatches = undefined
//             let closingTagMatches = undefined
                
//             // 1. accumulate opening tags
//             do {
//                 openingTagMatches = tagText.match(openingTagRegex)
//                 if(openingTagMatches !== null && openingTagMatches[0] !== undefined){
//                     tagText = tagText.substring(openingTagMatches[0].length)
//                     tagGroupString += openingTagMatches[0]
//                     // no need to accumulate if the tag is a selfclosing tag 
//                     if(openingTagMatches[2] === "/>"){
//                         if(!unclosedTagExist()){
//                             return tagGroupString
//                         } else {
//                             openingTagMatches = tagText.match(openingTagRegex)
//                             continue
//                         }
//                     } else {
//                         unclosedTagCnt += 1
//                     }
//                 }
//             } while(openingTagMatches !== null && openingTagMatches[0] !== undefined)

//             // 2. accumulate closing tags
//             do {
//                 closingTagMatches = tagText.match(closingTagRegex)
//                 if(closingTagMatches !== null && closingTagMatches[0] !== undefined){
//                     tagText = tagText.substring(closingTagMatches[0].length)
//                     tagGroupString += closingTagMatches[0]
//                     unclosedTagCnt -= 1
//                 }
//             } while(closingTagMatches !== null && closingTagMatches[0] !== undefined)

//         } while(unclosedTagExist())
        
//         return tagGroupString
//     }

//     // check result
//     if(tagGroups.length < 1){
//         throw new Error(`Could not create tag groups for '${tagText}'`)
//     } else {
//         return tagGroups
//     }
// }


// function createTagGroupStrings_recoursive(tagText, array = []){
//     if(tagText.length > 0){
//         const firstTagName = (() => {
//             let matches = tagText.match(/^<([a-zA-Z\d]+)/)
//             return (matches !== null) ? matches[1] : undefined
//         })()
//         array.push(createGroup(tagText, firstTagName))
//         return createTagGroupStrings_recoursive(tagText.substr(array[array.length-1].length), array)
//     } else {
//         return array
//     }
//     function createGroup(text, tagName, tagStr = "", unclosed = undefined){
//         const openingTagRegex = new RegExp(`^(<${tagName}(?:[^\\/>]*)(?:(?=((\\/)>))\\2|(?:>.*?(?=<\\/${tagName}|<${tagName}))))`)
//         const closingTagRegex = new RegExp(`^(<\\/${tagName}>(?:.*?)(?=(?:<\\/${tagName})|(?:<${tagName}))|(?:<\\/${tagName}>))`)
//         const unclosedTagExist = () => unclosed !== 0
        
//         if(!unclosedTagExist()){
//             // finish recursion
//             return tagStr
//         } else {
//             unclosed = (unclosed === undefined) ? 0 : unclosed
//             // 1. accumulate opening tags
//             let openMatch = text.match(openingTagRegex)
//             if(openMatch !== null && openMatch[0] !== undefined){
//                 // no need to accumulate if the tag is a selfclosing tag 
//                 if(openMatch[2] === "/>"){
//                     if(!unclosedTagExist()){
//                         return openMatch[0]
//                     } else {
//                         return tagStr + createGroup(text.substr(openMatch[0].length), tagName, openMatch[0], unclosed)
//                     }
//                 } 
//                 else {
//                     return tagStr + createGroup(text.substr(openMatch[0].length), tagName, openMatch[0], ++unclosed)
//                 }
//             }
            
//             // 2. accumulate closing tags
//             let closeMatch = text.match(closingTagRegex)
//             if(closeMatch !== null && closeMatch[0] !== undefined){
//                 return tagStr + createGroup(text.substr(closeMatch[0].length), tagName, closeMatch[0], --unclosed)
//             }
//         }
//     }
// }