import { Router } from "express";
import {
  login,
  register,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getMe,
} from "../controllers/authController";
import {
  authenticateToken,
  csrfProtection,
} from "../middleware/authMiddleware";

const router = Router();

// Публичные маршруты (без CSRF защиты)
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/validate-reset-token", validateResetToken);

// Защищенные маршруты (с CSRF защитой)
router.post("/logout", authenticateToken, csrfProtection, logout);
router.get("/me", authenticateToken, csrfProtection, getMe);

export default router;
