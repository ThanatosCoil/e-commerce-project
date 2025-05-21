import { Router } from "express";
import {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController";
import {
  authenticateToken,
  isSuperAdmin,
  csrfProtection,
} from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/create",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  createCoupon
);
router.get(
  "/get",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  getAllCoupons
);
router.delete(
  "/delete/:id",
  authenticateToken,
  csrfProtection,
  isSuperAdmin,
  deleteCoupon
);
router.get(
  "/validate/:code",
  authenticateToken,
  csrfProtection,
  validateCoupon
);

export default router;
