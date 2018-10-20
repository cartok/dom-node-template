const presets = [
  ["@babel/env", { 
    targets: {
      browsers: "last 2 versions"
    },
    useBuiltIns: "usage",
  }],
]

const plugins = [
    "@babel/plugin-transform-flow-strip-types", 
]

module.exports = { presets, plugins }