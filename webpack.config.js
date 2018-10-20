const webpack = require("webpack")
const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")

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
    optimization: {
        concatenateModules: false,
        // minimize: false,
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                terserOptions: {
                    ecma: 8,
                    compress: {
                        drop_console: true,
                    },
                    mangle: {
                        reserved: [
                            "NodeTemplate",
                        ],
                    },
                },
            })
        ]
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(true),
    ],
}
