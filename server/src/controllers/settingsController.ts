import { prisma } from "../server";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Response } from "express";
import cloudinary from "../config/cloudinary";
import fs from "fs";

export const addFeatureBanners = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: "No files uploaded" });
      return;
    }

    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "feature-banners",
      })
    );

    const uploadedImages = await Promise.all(uploadPromises);
    const banners = await Promise.all(
      uploadedImages.map((image) =>
        prisma.featureBanner.create({
          data: { imageUrl: image.secure_url },
        })
      )
    );

    files.forEach((file) => {
      fs.unlinkSync(file.path);
    });

    res.status(200).json({ success: true, banners });
  } catch (error) {
    console.error("Error adding feature banner:", error);
    res.status(500).json({ error: "Failed to add feature banner" });
  }
};

export const getFeatureBanners = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const banners = await prisma.featureBanner.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });

    res.status(200).json({ success: true, banners });
  } catch (error) {
    console.error("Error getting feature banners:", error);
    res.status(500).json({ error: "Failed to get feature banners" });
  }
};

export const deleteFeatureBanner = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.featureBanner.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Feature banner deleted" });
  } catch (error) {
    console.error("Error deleting feature banner:", error);
    res.status(500).json({ error: "Failed to delete feature banner" });
  }
};

export const updateBannerOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { bannerOrder } = req.body;

    if (!Array.isArray(bannerOrder)) {
      res.status(400).json({
        success: false,
        error: "Invalid banner order data",
      });
      return;
    }

    // Обновляем порядок отображения для каждого баннера
    for (const item of bannerOrder) {
      await prisma.featureBanner.update({
        where: { id: item.id },
        data: { displayOrder: item.order },
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner order updated successfully",
    });
  } catch (error) {
    console.error("Error updating banner order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update banner order",
    });
  }
};

export const getFeaturedProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const featuredProducts = await prisma.product.findMany({
      where: {
        isFeatured: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, featuredProducts });
  } catch (error) {
    console.error("Error getting featured products:", error);
    res.status(500).json({ error: "Failed to get featured products" });
  }
};

export const updateFeaturedProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length > 8) {
      res.status(400).json({
        success: false,
        error: "Invalid product IDs or too many requested",
      });
      return;
    }

    await prisma.product.updateMany({
      data: { isFeatured: false },
    });

    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { isFeatured: true },
    });

    res
      .status(200)
      .json({ success: true, message: "Featured products updated" });
  } catch (error) {
    console.error("Error updating featured products:", error);
    res.status(500).json({ error: "Failed to update featured products" });
  }
};
