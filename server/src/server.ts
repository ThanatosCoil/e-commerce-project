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
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

dotenv.config();

// Выводим информацию о DATABASE_URL для диагностики (без отображения пароля)
const dbUrl = process.env.DATABASE_URL || "";
const sanitizedDbUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
console.log(`Database URL (sanitized): ${sanitizedDbUrl}`);

const app = express();
const PORT = process.env.PORT || 3001;

// Создаем папку uploads, если она не существует
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads directory:", uploadDir);
}

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

// --- MONOREPO: Allow CORS from same domain (frontend and backend on same Railway project) ---
const corsOptions = {
  origin: true, // Allow requests from same domain (monorepo setup)
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

export const prisma = new PrismaClient();

// Функция для проверки подключения к базе данных с повторными попытками
async function waitForDatabase(maxRetries = 10, retryInterval = 5000) {
  let retries = 0;

  // Выводим информацию о переменных окружения для диагностики
  console.log("Environment variables check:");
  console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`- DATABASE_URL is set: ${!!process.env.DATABASE_URL}`);
  console.log(`- PORT: ${process.env.PORT}`);

  while (retries < maxRetries) {
    try {
      console.log(
        `Attempt ${retries + 1}/${maxRetries}: Checking database connection...`
      );

      // Пробуем выполнить простой запрос к базе данных
      await prisma.$queryRaw`SELECT 1`;

      console.log("Successfully connected to the database!");
      return true;
    } catch (error) {
      console.error(
        `Database connection attempt ${retries + 1} failed:`,
        error
      );

      retries++;
      if (retries >= maxRetries) {
        console.error(
          "Max retries reached. Could not connect to the database."
        );
        return false;
      }

      console.log(
        `Waiting ${retryInterval / 1000} seconds before next attempt...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }

  return false;
}

// Функция для выполнения миграций
async function runMigrations() {
  try {
    console.log("Running database migrations...");
    await execAsync("npx prisma migrate deploy");
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
  }
}

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

app.listen(Number(PORT), "0.0.0.0", async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // Ждем доступности базы данных перед запуском миграций
    console.log("Waiting for database to be available...");
    const isDatabaseAvailable = await waitForDatabase();

    if (isDatabaseAvailable) {
      // Запускаем миграции только если база данных доступна
      await runMigrations();
    } else {
      console.error(
        "Database is not available after maximum retries. Skipping migrations."
      );
    }

    // Инициализация подключения к Redis
    if (process.env.REDIS_URL) {
      await initRedis();
      console.log("Redis initialized successfully");
    } else {
      console.log("Redis URL not provided, skipping Redis initialization");
    }

    // Инициализация cron задачи для очистки устаревших токенов сброса пароля
    setupTokenCleanupJob();
  } catch (error) {
    console.error("Error during server initialization:", error);
  }
});

process.on("SIGINT", async () => {
  // Закрываем соединение с Redis
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
    console.log("Redis connection closed");
  }

  await prisma.$disconnect();
  console.log("Database connection closed");
  process.exit(0);
});

// Обработка необработанных исключений
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
