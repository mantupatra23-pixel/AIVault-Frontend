/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Ye domains allow karte hain external logos ko load hone ke liye
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'api.faviconkit.com',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: 'producthunt.com',
      },
      {
        protocol: 'https',
        hostname: 'ph-static.imgix.net',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
      },
    ],
    // Agar image load nahi hoti toh broken link ki wajah se build fail nahi hoga
    unoptimized: true, 
  },
  // Verel/Next.js ke naye versions ke liye compatibility
  experimental: {
    turbo: {
      rules: {
        // Custom rules agar zaroorat pade
      },
    },
  },
};

export default nextConfig;
