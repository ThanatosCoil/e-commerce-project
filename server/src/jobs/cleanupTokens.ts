import cron from "node-cron";
import { prisma } from "../server";

/**
 * Задача для очистки устаревших токенов сброса пароля
 * Запускается каждый день в 3:00 утра
 */
export function setupTokenCleanupJob() {
  console.log("Setting up token cleanup job to run daily at 3:00 AM");

  // Расписание: каждый день в 3:00 утра (0 3 * * *)
  cron.schedule("0 3 * * *", async () => {
    try {
      const now = new Date();
      console.log(`Running token cleanup job at ${now.toISOString()}`);

      const result = await prisma.user.updateMany({
        where: {
          resetPasswordExpires: {
            lt: now, // Где срок действия токена истек (меньше текущего времени)
          },
          NOT: {
            resetPasswordToken: null,
          },
        },
        data: {
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      console.log(
        `Cleanup completed: ${result.count} expired reset tokens removed`
      );
    } catch (error) {
      console.error("Error in token cleanup job:", error);
    }
  });
}
