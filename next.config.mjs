/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.VERCEL ? ".next" : process.env.NEXT_OUTPUT_DIR || ".next",
};
export default nextConfig;
