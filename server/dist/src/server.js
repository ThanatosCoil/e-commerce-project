"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const couponRoutes_1 = __importDefault(require("./routes/couponRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const addressRoutes_1 = __importDefault(require("./routes/addressRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const cleanupTokens_1 = require("./jobs/cleanupTokens");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const redis_1 = require("./config/redis");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
dotenv_1.default.config();
// Выводим информацию о DATABASE_URL для диагностики (без отображения пароля)
const dbUrl = process.env.DATABASE_URL || "";
const sanitizedDbUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
console.log(`Database URL (sanitized): ${sanitizedDbUrl}`);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Создаем папку uploads, если она не существует
const uploadDir = path_1.default.join(__dirname, "uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
exports.prisma = new client_1.PrismaClient();
// Функция для проверки подключения к базе данных с повторными попытками
function waitForDatabase() {
    return __awaiter(this, arguments, void 0, function* (maxRetries = 10, retryInterval = 5000) {
        let retries = 0;
        // Выводим информацию о переменных окружения для диагностики
        console.log("Environment variables check:");
        console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`- DATABASE_URL is set: ${!!process.env.DATABASE_URL}`);
        console.log(`- PORT: ${process.env.PORT}`);
        while (retries < maxRetries) {
            try {
                console.log(`Attempt ${retries + 1}/${maxRetries}: Checking database connection...`);
                // Пробуем выполнить простой запрос к базе данных
                yield exports.prisma.$queryRaw `SELECT 1`;
                console.log("Successfully connected to the database!");
                return true;
            }
            catch (error) {
                console.error(`Database connection attempt ${retries + 1} failed:`, error);
                retries++;
                if (retries >= maxRetries) {
                    console.error("Max retries reached. Could not connect to the database.");
                    return false;
                }
                console.log(`Waiting ${retryInterval / 1000} seconds before next attempt...`);
                yield new Promise((resolve) => setTimeout(resolve, retryInterval));
            }
        }
        return false;
    });
}
// Функция для выполнения миграций
function runMigrations() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Running database migrations...");
            yield execAsync("npx prisma migrate deploy");
            console.log("Migrations completed successfully");
        }
        catch (error) {
            console.error("Error running migrations:", error);
        }
    });
}
app.use("/api/auth", authRoutes_1.default);
app.use("/api/product", productRoutes_1.default);
app.use("/api/coupon", couponRoutes_1.default);
app.use("/api/settings", settingsRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/cart", cartRoutes_1.default);
app.use("/api/address", addressRoutes_1.default);
app.use("/api/order", orderRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Hello From Backend");
});
app.listen(Number(PORT), "0.0.0.0", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server is running on port ${PORT}`);
    try {
        // Ждем доступности базы данных перед запуском миграций
        console.log("Waiting for database to be available...");
        const isDatabaseAvailable = yield waitForDatabase();
        if (isDatabaseAvailable) {
            // Запускаем миграции только если база данных доступна
            yield runMigrations();
        }
        else {
            console.error("Database is not available after maximum retries. Skipping migrations.");
        }
        // Инициализация подключения к Redis
        if (process.env.REDIS_URL) {
            yield (0, redis_1.initRedis)();
            console.log("Redis initialized successfully");
        }
        else {
            console.log("Redis URL not provided, skipping Redis initialization");
        }
        // Инициализация cron задачи для очистки устаревших токенов сброса пароля
        (0, cleanupTokens_1.setupTokenCleanupJob)();
    }
    catch (error) {
        console.error("Error during server initialization:", error);
    }
}));
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    // Закрываем соединение с Redis
    if (redis_1.redisClient && redis_1.redisClient.isOpen) {
        yield redis_1.redisClient.disconnect();
        console.log("Redis connection closed");
    }
    yield exports.prisma.$disconnect();
    console.log("Database connection closed");
    process.exit(0);
}));
// Обработка необработанных исключений
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});
