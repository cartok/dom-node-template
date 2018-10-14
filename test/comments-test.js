// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"


// actual code imports
import NodeTemplate from "../dist/NodeTemplate.js"

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

describe("Remove Comments Test", () => {
    const s = new NodeTemplate(`
        <!-- asdf -->
        <g>
            <g>
            /*
                // <rect data-ref="menu-node" width="100" height="100" class="sia-menu-node sia-menu-node-selected"/>
                // <rect data-ref="menu-items" width="100" height="100" class="sia-menu-items"/>
                <text data-ref="label" class="sia-label"></text>
                <!-- asdf -->
                <g data-ref="close-button">
                    <!-- asdf -->
                    <line x1="20%" y1="20%" x2="80%" y2="80%"/>
                    // <line x1="20%" y1="80%" x2="80%" y2="20%"/>
                </g>
            */
            </g>
            <canvas data-ref="canvas"></canvas>
        </g>
        <!-- asdf -->
        // jojo
    `)
    it("Should have removed comments", () => {
        s.refs.canvas.namespaceURI.should.equal("http://www.w3.org/1999/xhtml")    
    })
})
