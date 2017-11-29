// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

const multipleSvgs = new NodeTemplate(`
    <svg id="1" xmlns="http://www.w3.org/2000/svg"></svg>
    <svg id="2" xmlns="http://www.w3.org/2000/svg"></svg>
    <svg id="3" xmlns="http://www.w3.org/2000/svg"><g><rect data-ref="hodor"></rect></g></svg>
`)
console.log(multipleSvgs)

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
console.log(htmlWithSvgs)

const justHtml = new NodeTemplate(`
    <div><h1 data-ref="hodor"></h1></div>
    <div><h1></h1></div>
    <div></div>
`)
console.log(justHtml)