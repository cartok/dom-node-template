// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

/*
const multipleSvgs = new NodeTemplate(`
    <svg id="1" xmlns="http://www.w3.org/2000/svg"></svg>
    <svg id="2" xmlns="http://www.w3.org/2000/svg"></svg>
    <svg id="3" xmlns="http://www.w3.org/2000/svg"><g><rect data-ref="hodor"></rect></g></svg>
`)
// console.log(multipleSvgs)

const htmlWithSvgs = new NodeTemplate(`
    <div id="papelapapapa">
        <div>
            <h1>hello love</h1>
        </div>
        <svg id="outer" data-ref="hodor">
            <svg id="inner"></svg>
        </svg>    
        <svg id="second"></svg>
    </div>
    <svg id="standalone"></svg>
`)
// console.log(htmlWithSvgs)

const justHtml = new NodeTemplate(`
    <div><h1 data-ref="hodor"></h1></div>
    <div><h1></h1></div>
    <div></div>
`)
// console.log(justHtml)


const oneSvgGroup = new NodeTemplate(`
    <g>hi world</g>
`, { isSvg: true })
// console.log(oneSvgGroup)
const twoSvgGroups = new NodeTemplate(`
    <g>hi world</g>
    <g>hi world</g>
`, { isSvg: true })
// console.log(twoSvgGroups)
*/

// const forceSvg = new NodeTemplate(`
//     <g data-name="point" 
//         transform="translate(0,0)">
        
//         <circle data-ref="collisionNode"
//             cx="3"
//             cy="3"
//             r="6"
//             fill="red">
//         </circle>

//         <circle data-ref="outlineNode"
//             class="drawable-collision-node drawable-disabled"
//             cx="5"
//             cy="5"
//             r="10"
//             fill="white">
//         </circle>

//     </g>
// `, { isSvg: true })
// console.log(forceSvg)

// const foreignObjectSingle = new NodeTemplate(`
//     <svg>
//         <foreignObject>
//             <div><h1>header</h1></div>
//         </foreignObject>
//     </svg>
// `)
// console.log(foreignObjectSingle)


const foWithSvg = new NodeTemplate(`
    <g>
        <foreignObject>
            <div><h1>header</h1><svg></svg></div>
        </foreignObject>
    </g>
`, { isSvg: true })
console.log(foWithSvg)