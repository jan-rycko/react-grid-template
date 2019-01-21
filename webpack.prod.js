const webpack = require('webpack');
const path = require('path');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { TSDeclerationsPlugin } = require('ts-loader-decleration');

const root = path.join.bind(path, path.resolve(__dirname, '.'));

module.exports = {
    entry: {
        index: root('./src/index.ts')
    },

    output: {
        path: root('./dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs2'
    },

    resolve: {
        alias: {
            src: root('./src/')
        },
        extensions: [".js", ".jsx", ".ts", ".tsx"]
    },
    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },

    module: {
		rules: [
			{
                exclude: /node_modules/,
                use: {
				    loader: 'ts-loader'
                },
				test: /\.(j|t)sx?$/
			},
			{
				test: /\.(scss|css)$/,

				use: [
					{
						loader: 'style-loader'
					},
					{
						loader: 'css-loader'
					},
					{
						loader: 'sass-loader'
					}
				]
			}
		]
	},

    devServer: {
        contentBase: root('./target/dist'),
	},

	optimization: {
		splitChunks: false
	},

    plugins: [
        new TSDeclerationsPlugin({
            main: './dist/index.d.ts'
        }),
    ]
};
