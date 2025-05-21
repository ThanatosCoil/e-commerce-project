/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com", "images.unsplash.com"],
  },
  // Добавляем rewrites для API-запросов в режиме разработки
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: "http://localhost:3001/api/:path*",
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
