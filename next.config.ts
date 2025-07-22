const isGithubPages = process.env.GITHUB_ACTIONS === 'true';

const repo = 'corner';

const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? `/${repo}` : '',
  assetPrefix: isGithubPages ? `/${repo}/` : '',
};

export default nextConfig;
