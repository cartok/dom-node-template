// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

const nt1 = new NodeTemplate(`<div></div>`)
console.log("nt1:")
console.log(nt1)

const nt2 = new NodeTemplate(`
    <g id="1.0">
        <g id="1.1"></g>
        <rect></rect>
    </g>
    <div id="2.0"></div>
`)
console.log("nt2:")
console.log(nt2)