const webpack = require("webpack")
const path = require("path")

module.exports = {
    // entry:  path.resolve(__dirname, "src/index"),
    output: {
        filename: "bundle.js",
        sourceMapFilename : "[file].map",
        path: path.resolve(__dirname, "build"),
    },
    devtool: "inline-source-map",
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
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        new webpack.optimize.OccurrenceOrderPlugin(true),
    ],
}
