const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

const app = express();

// Проксирование /api запросов к бэкенду
app.use(
  "/api",
  createProxyMiddleware({
    target: "https://e-commerce-project-production-47e2.up.railway.app", // URL бэкенда
    changeOrigin: true,
    pathRewrite: { "^/api": "/api" },
    cookieDomainRewrite: "", // Перезапись домена cookie на текущий домен
    secure: true,
  })
);

// Сервирование статичных фронтендовых файлов
app.use(express.static(path.join(__dirname, "client", "out")));

// Откат к index.html для SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "out", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
