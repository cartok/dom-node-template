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
    </div>
`)
console.dir(detectHTML)

