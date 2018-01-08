// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

const test1 = new NodeTemplate(`
    <div>
    </div>
    <svg>
        <foreignObject>
            <div></div>
            <div></div>
            <div>
            <svg>
                <foreignObject>
                    <div></div>
                </foreignObject>
            </svg>
            <svg>
                <foreignObject>
                </foreignObject>
            </svg>
            </div>
        </foreignObject>
    </svg>
    <div>
    </div>
`)
console.dir(test1)

describe("Node Template Tests", () => {
    describe("XMLNS Tests", () => {
        const s = new NodeTemplate(`
            <svg>
                <canvas data-ref="canvas"></canvas>
            </svg>
        `)
        it("Embedded content should have XHTML namespace.", () => {
            s.refs.canvas.namespaceURI.should.equal("http://www.w3.org/1999/xhtml")    
        })
    })
})
