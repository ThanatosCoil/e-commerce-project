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
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Создаем тестовый аккаунт для разработки
// В продакшн здесь должны быть реальные данные SMTP-сервера
let transporter;
function createTransporter() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV === "production") {
            // Настройки для продакшн окружения
            transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || "587"),
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
        }
        else {
            try {
                // Для разработки используем тестовый аккаунт Ethereal
                const testAccount = yield nodemailer_1.default.createTestAccount();
                transporter = nodemailer_1.default.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                console.log(`Test email account created: ${testAccount.user} / ${testAccount.pass}`);
                console.log("View emails at: https://ethereal.email");
            }
            catch (error) {
                console.error("Failed to create test account, using memory transport:", error);
                // Создаем резервный транспортер, который не отправляет письма, но эмулирует отправку
                // Это позволит приложению работать, если Nodemailer API недоступен
                transporter = nodemailer_1.default.createTransport({
                    jsonTransport: true,
                });
            }
        }
    });
}
// Инициализируем транспортер при запуске сервера
createTransporter();
function sendEmail(to, subject, html) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Если транспортер не был инициализирован, создаем его
            if (!transporter) {
                yield createTransporter();
            }
            const info = yield transporter.sendMail({
                from: `"E-commerce Project" <${process.env.EMAIL_FROM || "noreply@example.com"}>`,
                to,
                subject,
                html,
            });
            // Для разработки возвращаем URL для просмотра письма
            if (process.env.NODE_ENV !== "production") {
                if (transporter.name === "JSONTransport") {
                    console.log("Email content (not actually sent):", info.message);
                    return null;
                }
                const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
                return previewUrl ? previewUrl.toString() : null;
            }
            return null;
        }
        catch (error) {
            console.error("Error sending email:", error);
            // Только логируем ошибку, но не пробрасываем ее дальше
            // Это предотвратит падение приложения из-за проблем с отправкой писем
            return null;
        }
    });
}
