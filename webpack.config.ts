import * as path from 'path';
import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import StatoscopePlugin from '@statoscope/webpack-plugin';

import ModuleLogger from './plugins/moduleLogger';
import {whiteList} from "./utils/whiteList";

const config: webpack.Configuration = {
    mode: 'production',
    entry: {
        root: './src/pages/root.tsx',
        root2: './src/pages/root2.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new ModuleLogger({
            whiteList: whiteList
        }),
        new StatoscopePlugin({
            saveStatsTo: 'stats.json',
            saveOnlyStats: false,
            open: false,
        }),
    ],
    resolve: {
        fallback: {
            'buffer': require.resolve('buffer'),
            'stream': false,
        },
        alias: {
          'crypto-browserify$': path.resolve(__dirname, 'src/utils/uuidProxy.ts')
        },
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/'],
            }
        ],
    },
    optimization: {
        concatenateModules: true,
        splitChunks: {
            minChunks: 2,
            chunks: 'all',
            minSize: 0
        }
    }
};

export default config;
