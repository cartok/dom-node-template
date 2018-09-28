const webpack = require("webpack")
const path = require("path")

module.exports = {
    output: {
        filename: "bundle.js",
        sourceMapFilename : "[file].map",
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(true),
    ],
}
