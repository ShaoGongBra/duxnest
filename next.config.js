/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/': path.resolve(__dirname, 'src'),
      'app/': path.resolve(__dirname, 'src', 'apps'),
    };
    return config;
  },
};
