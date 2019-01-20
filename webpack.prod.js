const webpack = require('webpack');
const path = require('path');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { TSDeclerationsPlugin } = require('ts-loader-decleration');

const root = path.join.bind(path, path.resolve(__dirname, '.'));

module.exports = {
    entry: {
        index: root('./src/index.ts')
    },

    resolve: {
        alias: {
            src: root('./src/')
        },
        extensions: [".js", ".jsx", ".ts", ".tsx"]
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

	output: {
        path: root('./dist'),
		chunkFilename: '[name].js',
		filename: '[name].js',
        libraryTarget: 'commonjs'
	},

	mode: 'production',

	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: {
					priority: -10,
					test: /[\\/]node_modules[\\/]/
				}
			},

			chunks: 'async',
			minChunks: 1,
			minSize: 30000,
			name: true
		}
	},
    plugins: [
        new TSDeclerationsPlugin({
            main: './dist/index.d.ts'
        }),
    ]
};
