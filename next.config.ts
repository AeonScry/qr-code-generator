/** @type {import('next').NextConfig} */
const repo = "qr-code-generator"; // <-- change this

const nextConfig = {
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
};

module.exports = nextConfig;