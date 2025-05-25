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
      : [
          {
            source: "/api/:path*",
            destination:
              "https://e-commerce-project-production-47e2.up.railway.app/api/:path*",
          },
        ];
  },
  // Отключаем проверку ESLint при сборке
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Отключаем проверку типов TypeScript при сборке
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
