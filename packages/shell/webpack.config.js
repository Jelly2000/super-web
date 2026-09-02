const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = (_env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { rootMode: 'upward' },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js',
      // Feature modules aren't scaffolded yet (see docs/IMPLEMENTATION.md Phase 4).
      // Remotes are resolved lazily at runtime via src/moduleLoader.ts, so listing
      // them here ahead of time doesn't break the build if they aren't running.
      remotes: {
        feature_profile: 'feature_profile@http://localhost:3001/remoteEntry.js',
        feature_portfolio: 'feature_portfolio@http://localhost:3002/remoteEntry.js',
        feature_blog: 'feature_blog@http://localhost:3003/remoteEntry.js',
      },
      exposes: {
        './AppShell': './src/components/AppShell',
        './useAppContext': './src/hooks/useAppContext',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0' },
        // TODO: add '@jelly/component-ui-library' and '@jelly/sw-core-engine' as
        // singletons once they're published to GitHub Packages (see docs/ARCHITECTURE.md).
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
});
