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
const detectSVG = new NodeTemplate(`
    <svg data-ref="hui" xmlns="http://www.w3.org/2000/svg">
        <g></g>
    </svg>
`)

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
