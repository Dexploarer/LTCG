import type { NextConfig } from 'next';
import path from 'path';

const config: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@convex': path.resolve(__dirname, '../../convex'),
    };
    return config;
  },
};

export default config;
