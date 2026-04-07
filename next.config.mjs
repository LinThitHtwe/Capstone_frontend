/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend =
      process.env.BACKEND_API_ORIGIN?.replace(/\/$/, "") ??
      "http://127.0.0.1:8001";
    return [
      {
        source: "/django-api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
