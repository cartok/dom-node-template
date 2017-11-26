// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

const detectHTML = new NodeTemplate(`
    <div>
        <div data-ref="data-ref"></div>
        <div id="id"></div>
    </div>
`)
console.dir(detectHTML)
const detectSVG = new NodeTemplate(`
    <svg data-ref="hui" xmlns="http://www.w3.org/2000/svg">
        <g></g>
    </svg>
`)
// console.dir(detectSVG)
describe("Node Template Type Detectino Feature Tests", () => {
    describe("xml string starting and closing with not-'svg' tag", () => {
        it("should detect html", () => {
            
        })
    })
    describe("xml string starting and closing with 'svg' tag", () => {
        it("should detect svg", () => {
            
        })
    })
})


const oneRoot = new NodeTemplate(`
    <div id="oneRoot"></div>
`)
// console.dir(oneRoot)
console.dir(oneRoot)
const multipleRoots = new NodeTemplate(`
    <div id="multipleRoots-1"></div>
    <div id="multipleRoots-2"></div>
`)
console.dir(multipleRoots)
// console.log(multipleRoots.info)