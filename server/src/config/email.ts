import nodemailer from "nodemailer";

// Создаем тестовый аккаунт для разработки
// В продакшн здесь должны быть реальные данные SMTP-сервера
let transporter: nodemailer.Transporter;

async function createTransporter() {
  if (process.env.NODE_ENV === "production") {
    // Настройки для продакшн окружения
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    try {
      // Для разработки используем тестовый аккаунт Ethereal
      const testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log(
        `Test email account created: ${testAccount.user} / ${testAccount.pass}`
      );
      console.log("View emails at: https://ethereal.email");
    } catch (error) {
      console.error(
        "Failed to create test account, using memory transport:",
        error
      );
      // Создаем резервный транспортер, который не отправляет письма, но эмулирует отправку
      // Это позволит приложению работать, если Nodemailer API недоступен
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
}

// Инициализируем транспортер при запуске сервера
createTransporter();

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<string | null> {
  try {
    // Если транспортер не был инициализирован, создаем его
    if (!transporter) {
      await createTransporter();
    }

    const info = await transporter.sendMail({
      from: `"E-commerce Project" <${
        process.env.EMAIL_FROM || "noreply@example.com"
      }>`,
      to,
      subject,
      html,
    });

    // Для разработки возвращаем URL для просмотра письма
    if (process.env.NODE_ENV !== "production") {
      if ((transporter as any).name === "JSONTransport") {
        console.log("Email content (not actually sent):", info.message);
        return null;
      }

      const previewUrl = nodemailer.getTestMessageUrl(info);
      return previewUrl ? previewUrl.toString() : null;
    }

    return null;
  } catch (error) {
    console.error("Error sending email:", error);
    // Только логируем ошибку, но не пробрасываем ее дальше
    // Это предотвратит падение приложения из-за проблем с отправкой писем
    return null;
  }
}
