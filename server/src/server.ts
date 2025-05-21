import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import couponRoutes from "./routes/couponRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import cartRoutes from "./routes/cartRoutes";
import addressRoutes from "./routes/addressRoutes";
import adminRoutes from "./routes/adminRoutes";
import { setupTokenCleanupJob } from "./jobs/cleanupTokens";
import fs from "fs";
import path from "path";
import orderRoutes from "./routes/orderRoutes";
import { initRedis, redisClient } from "./config/redis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Создаем папку uploads, если она не существует
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads directory:", uploadDir);
}

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

export const prisma = new PrismaClient();

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Hello From Backend");
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Инициализация подключения к Redis
  await initRedis();

  // Инициализация cron задачи для очистки устаревших токенов сброса пароля
  setupTokenCleanupJob();
});

process.on("SIGINT", async () => {
  // Закрываем соединение с Redis
  if (redisClient.isOpen) {
    await redisClient.destroy();
    console.log("Redis connection closed");
  }

  await prisma.$disconnect();
  console.log("Database connection closed");
  process.exit(0);
});
