// add chai to env
import chai from "chai"
import { expect } from "chai"
chai.should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

describe("Node Template Tests", () => {
    describe("create a node and validate its state.", () => {
        const s = new NodeTemplate(`
            <div id="container">
                <h1>hello kitty</h1>
            </div>
        `)
        it("should create node template", () => {
            s.text.should.be.an("string")
            // s.fragment.should.be.an("object")
            // s.root.should.be.an("object")
            s.refs.should.be.an("object")
            s.ids.should.be.an("object")    
        })
        it("should have 1 id", () => {
            Object.keys(s.ids).length.should.equal(1)
        })
        it("should have a h1 tag 'hello kitty' as text node as first child", () => {
            $(s.ids["container"].firstElementChild).text().should.equal("hello kitty")
        })
    })
})
