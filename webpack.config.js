const path = require('path');
const env = require('dotenv');

module.exports = {
    mode: process.env.NODE_ENV,
    entry: './src/index.js',
    target: 'node',
    module: {
        rules: [{
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }]
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },  
};  