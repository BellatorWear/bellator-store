/** @type {import('next').NextConfig} */
const nextConfig = {
  // Das hier sagt Next.js, wo der echte Root ist
  experimental: {
    // Falls du Turbopack nutzt:
    // turbopack: {
    //   root: "./"
    // },
  },
};

module.exports = nextConfig;