import NodeTemplate from "../build/NodeTemplate.js"

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
console.dir(test1)