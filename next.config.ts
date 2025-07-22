const repo = 'corner';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  images: { unoptimized: true },
};

export default nextConfig;
