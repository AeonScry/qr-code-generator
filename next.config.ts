/** @type {import('next').NextConfig} */
const repo = "qr-code-generator"; // <-- change this

const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  ...(isProd && {
    output: "export",
    basePath: `/${repo}`,
    assetPrefix: `/${repo}/`,
  }),
};

export default nextConfig;