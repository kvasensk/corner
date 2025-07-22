const isGithubPages = process.env.GITHUB_ACTIONS === 'true';

const repo = 'corner';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/corner',
  assetPrefix: '/corner/',
  images: { unoptimized: true },
};
export default nextConfig;
