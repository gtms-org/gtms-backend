const path = require('path')
const nodeExternals = require('webpack-node-externals')

const PATH_DELIMITER = '[\\\\/]'

const safePath = module => module.split('/').join(PATH_DELIMITER)

const generateIncludes = modules => {
  return [
    new RegExp(`(${modules.map(safePath).join('|')})$`),
    new RegExp(
      `(${modules.map(safePath).join('|')})${PATH_DELIMITER}(?!.*node_modules)`
    ),
  ]
}

const localModules = [
  '@gtms/commons',
  '@gtms/lib-logger',
  '@gtms/lib-middlewares',
  '@gtms/lib-models',
  '@gtms/lib-gatekeeper',
  '@gtms/lib-api',
  '@gtms/client-mongoose',
  '@gtms/client-queue',
  '@gtms/lib-http-server',
  '@gtms/lib-consul',
]

module.exports = {
  entry: path.join(process.cwd(), './src/start.ts'),
  devtool: 'source-map',
  target: 'node',
  externals: [
    nodeExternals({
      modulesDir: '../../node_modules',
      whitelist: localModules
    }),
  ],
  output: {
    path: path.resolve(process.cwd(), 'dist'),
    filename: 'index.js',
    library: 'index',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        include: generateIncludes(['./src', ...localModules]),
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
}
