const presets = [
  ["@babel/env", {
    targets: {
      edge: "16",
      firefox: "61",
      chrome: "68",
      safari: "11.1"
    },
    useBuiltIns: "usage"
  }]
]

const plugins = [
    "@babel/plugin-transform-flow-strip-types", 
]

module.exports = { presets, plugins };