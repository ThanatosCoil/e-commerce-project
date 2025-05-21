import { Router } from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
} from "../controllers/cartController";
import {
  authenticateToken,
  csrfProtection,
} from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, csrfProtection, getCart);
router.post("/", authenticateToken, csrfProtection, addToCart);
router.delete("/clear", authenticateToken, csrfProtection, clearCart);
router.delete("/:id", authenticateToken, csrfProtection, removeFromCart);
router.put("/:id", authenticateToken, csrfProtection, updateCartItemQuantity);

export default router;
