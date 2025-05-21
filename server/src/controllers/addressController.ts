import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Response } from "express";
import { prisma } from "../server";

export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { name, address, country, city, zipCode, phone, isDefault } =
      req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        name,
        address,
        country,
        city,
        zipCode,
        phone,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getAddresses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });

    res.status(200).json({ success: true, address: addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      res.status(404).json({ success: false, message: "Address not found" });
      return;
    }

    const { name, address, country, city, zipCode, phone, isDefault } =
      req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        name,
        address,
        country,
        city,
        zipCode,
        phone,
        isDefault: isDefault || false,
      },
    });

    res.status(200).json({ success: true, address: updatedAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      res.status(404).json({ success: false, message: "Address not found" });
      return;
    }

    // Проверяем, связан ли адрес с заказами
    const ordersWithAddress = await prisma.order.findFirst({
      where: { addressId: id },
    });

    if (ordersWithAddress) {
      res.status(400).json({
        success: false,
        message: "This address cannot be deleted because it is used in orders",
      });
      return;
    }

    await prisma.address.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
