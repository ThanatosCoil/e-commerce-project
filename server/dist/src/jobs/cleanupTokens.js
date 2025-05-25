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
exports.setupTokenCleanupJob = setupTokenCleanupJob;
const node_cron_1 = __importDefault(require("node-cron"));
const server_1 = require("../server");
/**
 * Задача для очистки устаревших токенов сброса пароля
 * Запускается каждый день в 3:00 утра
 */
function setupTokenCleanupJob() {
    console.log("Setting up token cleanup job to run daily at 3:00 AM");
    // Расписание: каждый день в 3:00 утра (0 3 * * *)
    node_cron_1.default.schedule("0 3 * * *", () => __awaiter(this, void 0, void 0, function* () {
        try {
            const now = new Date();
            console.log(`Running token cleanup job at ${now.toISOString()}`);
            const result = yield server_1.prisma.user.updateMany({
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
            console.log(`Cleanup completed: ${result.count} expired reset tokens removed`);
        }
        catch (error) {
            console.error("Error in token cleanup job:", error);
        }
    }));
}
