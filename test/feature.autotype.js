// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

// const test1 = new NodeTemplate(`
//     <div>
//     </div>
//         <foreignObject>
//         </foreignObject>
//     <div>
//     </div>
// `)
// console.dir(test1)

const test1 = new NodeTemplate(`
    <div>
    </div>
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
    <div>
    </div>
`)
// console.dir(test1)

