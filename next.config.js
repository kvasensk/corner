const repo = 'corner';

const isGithubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? `/${repo}` : '',
  assetPrefix: isGithubPages ? `/${repo}/` : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
