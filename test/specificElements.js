// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

describe("Test some specific elements", () => {
    describe("parse <img> without causing buffer overflow", () => {
        const n = new NodeTemplate(`
            <img src="">
        `)
        it("should create node template", () => {
            
        })
    })
})
