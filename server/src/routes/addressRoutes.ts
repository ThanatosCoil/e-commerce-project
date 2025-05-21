import { Router } from "express";
import {
  authenticateToken,
  csrfProtection,
} from "../middleware/authMiddleware";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../controllers/addressController";

const router = Router();

router.post("/", authenticateToken, csrfProtection, createAddress);
router.get("/", authenticateToken, csrfProtection, getAddresses);
router.put("/:id", authenticateToken, csrfProtection, updateAddress);
router.delete("/:id", authenticateToken, csrfProtection, deleteAddress);

export default router;
