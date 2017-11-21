// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

const first = new NodeTemplate(`
    <div>
        <div data-ref="data-ref"></div>
        <div id="id"></div>
    </div>
`)
const second = new NodeTemplate(`
    <h1>header</h1>
`)
first.addNode(first.ids.id, second)

describe("Node Template Method Feature Tests", () => {
    describe("addNode()", () => {
        it("should add", () => {
            first.ids.id.firstElementChild.innerHTML.should.equal("header")
        })
    })
})
