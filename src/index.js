// this file is used when compiling to es5 with webpack to expose the bundled version to the window object.
import _NodeTemplate from "./NodeTemplate"
const NodeTemplate = _NodeTemplate

export default NodeTemplate
window.NodeTemplate = NodeTemplate