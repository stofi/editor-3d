const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const webpack = require('webpack')

// get commit id
const commitId = require('child_process')
    .execSync('git rev-parse --short HEAD')
    .toString()
    .trim()
// get version number from package.json
const version = require('../package.json').version

// get the current date
const date = new Date()


module.exports = {
    entry: path.resolve(__dirname, '../src/main.ts'),
    target: ['web', 'es2020'],
    output: {
        hashFunction: 'xxhash64',
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../dist'),
    },
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{ from: path.resolve(__dirname, '../static') }],
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            minify: true,
        }),
        new webpack.DefinePlugin({
            'process.env.VERSION': JSON.stringify(version),
            'process.env.COMMIT_ID': JSON.stringify(commitId),
            'process.env.DATE': JSON.stringify(date.toISOString()),
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    module: {
        rules: [
            // HTML
            {
                test: /\.(html)$/,
                use: ['html-loader'],
            },

            // TS
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },

            // JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },

            // CSS
            // {
            //     test: /\.css$/,
            //     use: [MiniCSSExtractPlugin.loader, 'css-loader'],
            // },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[hash][ext]',
                },
            },

            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/fonts/[hash][ext]',
                },
            },
        ],
    },
}
