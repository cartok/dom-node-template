// add chai to env
import { should } from "chai"
import { expect } from "chai"
should()

// add jquery to env
import $ from "jquery"

// actual code imports
import NodeTemplate from "../build/NodeTemplate.js"

/*
REGEX PLAYGROUND: 
<div><div></div><div><div><div></div></div></div><div></div></div>

open:  ^(<div(?:[^\/>]*)(?:(?=((\/)>))\2|(?:>.*?(?=<\/div|<div))))
close: ^(<\/div>(?:.*?)(?=(?:<\/div)|(?:<div))|(?:<\/div>))

<div> 					    open
    <div></div> 		    open, close
    <div> 				    open 
        <div> 			    open
            <div></div>     open, close
        </div> 			    close
    </div> 				    close
    <div></div> 		    open, close
</div> 					    close


*/
const nt1 = new NodeTemplate(`<div></div>`)
console.log("\nnt1:", nt1)

const nt2 = new NodeTemplate(`<div/>`)
console.log("\nnt2:", nt2)

const nt3 = new NodeTemplate(`
    <div></div>
    <div></div>
    <div/>
`)
console.log("\nnt3:", nt3)

const nt4 = new NodeTemplate(`
    <div>
        <div></div>
    </div>
`)
console.log("\nnt4:", nt4)

const nt5 = new NodeTemplate(`
    <div>
        <div></div>
        <div>
            <div>
                <div></div>
            </div>
        </div>
        <div></div>
    </div>
`)
console.log("\nnt5:", nt5)

const nt6 = new NodeTemplate(`
    <div></div>
    <div>
        <div></div>
    </div>
    <div></div>
`)
console.log("\nnt6:", nt6)

// const ntx = new NodeTemplate(`
//     <g id="1.0">
//         <g id="1.1"></g>
//         <rect></rect>
//     </g>
//     <div id="2.0"></div>
// `)
// console.log("ntx:")
// console.log(ntx)