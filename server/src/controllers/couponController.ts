import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Response } from "express";
import { prisma } from "../server";

export const createCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { code, discount, startDate, endDate, usageLimit } = req.body;

    const newCoupon = await prisma.coupon.create({
      data: {
        code,
        discount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: parseInt(usageLimit),
        usageCount: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon: newCoupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAllCoupons = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({
      success: true,
      message: "Coupons fetched successfully",
      coupons,
    });
  } catch (error) {
    console.error("Error getting all coupons:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({
      where: { id },
    });
    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const validateCoupon = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({
        success: false,
        valid: false,
        message: "Coupon code is required",
      });
      return;
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        usageCount: { lt: prisma.coupon.fields.usageLimit },
      },
    });

    if (!coupon) {
      res.status(200).json({
        success: true,
        valid: false,
        message: "Invalid or expired coupon",
      });
      return;
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: "Coupon is valid",
      discount: coupon.discount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      valid: false,
      message: "Internal server error",
    });
  }
};
