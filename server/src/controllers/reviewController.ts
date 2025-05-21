import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { Response } from "express";
import { prisma } from "../server";

// Создание нового отзыва или обновление существующего
export const createOrUpdateReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId, rating, pros, cons, comment, isAnonymous } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!productId || !rating) {
      res.status(400).json({
        success: false,
        message: "Product ID and rating are required",
      });
      return;
    }

    // Проверяем существование продукта
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    // Проверяем, существует ли уже отзыв от этого пользователя
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    let review;
    if (existingReview) {
      // Обновляем существующий отзыв
      review = await prisma.review.update({
        where: {
          id: existingReview.id,
        },
        data: {
          rating,
          pros,
          cons,
          comment,
          isAnonymous,
        },
      });
    } else {
      // Создаем новый отзыв
      review = await prisma.review.create({
        data: {
          rating,
          pros,
          cons,
          comment,
          isAnonymous,
          user: {
            connect: { id: userId },
          },
          product: {
            connect: { id: productId },
          },
        },
      });
    }

    // Обновляем средний рейтинг продукта
    await updateProductRating(productId);

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error("Error creating/updating review:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Получение всех отзывов для продукта
export const getProductReviews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        productId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Не показываем email для анонимных отзывов
    const formattedReviews = reviews.map((review: any) => ({
      ...review,
      user: review.isAnonymous
        ? { id: review.userId, name: "Anonymous" }
        : review.user,
    }));

    res.status(200).json({ success: true, reviews: formattedReviews });
  } catch (error) {
    console.error("Error getting product reviews:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Получение отзыва пользователя для продукта
export const getUserReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const review = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    res.status(200).json({ success: true, review });
  } catch (error) {
    console.error("Error getting user review:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Удаление отзыва
export const deleteReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Проверяем, существует ли отзыв и принадлежит ли он пользователю
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    if (review.userId !== userId && req.user?.role !== "SUPER_ADMIN") {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
      return;
    }

    // Удаляем отзыв
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Обновляем средний рейтинг продукта
    await updateProductRating(review.productId);

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Вспомогательная функция для обновления среднего рейтинга продукта
const updateProductRating = async (productId: string): Promise<void> => {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
    },
    select: {
      rating: true,
    },
  });

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Округляем до 1 знака после запятой
      },
    });
  } else {
    // Если отзывов нет, устанавливаем рейтинг в 0
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        rating: 0,
      },
    });
  }
};

// Обновляем количество голосов отзыва
const updateReviewVoteCount = async (reviewId: string): Promise<void> => {
  const votes = await prisma.reviewVote.findMany({
    where: {
      reviewId,
    },
  });

  const upvotes = votes.filter((vote) => vote.isUpvote).length;
  const downvotes = votes.filter((vote) => !vote.isUpvote).length;
  const voteCount = upvotes - downvotes;

  await prisma.review.update({
    where: {
      id: reviewId,
    },
    data: {
      voteCount,
    },
  });
};

// Голосование за отзыв (лайк/дизлайк)
export const voteReview = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { isUpvote } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (typeof isUpvote !== "boolean") {
      res.status(400).json({
        success: false,
        message: "isUpvote must be a boolean",
      });
      return;
    }

    // Проверяем существование отзыва
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }

    // Пользователь не может голосовать за свой собственный отзыв
    if (review.userId === userId) {
      res.status(403).json({
        success: false,
        message: "You cannot vote for your own review",
      });
      return;
    }

    // Проверяем, голосовал ли пользователь за этот отзыв ранее
    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    let vote;
    if (existingVote) {
      // Обновляем существующий голос
      vote = await prisma.reviewVote.update({
        where: {
          id: existingVote.id,
        },
        data: {
          isUpvote,
        },
      });
    } else {
      // Создаем новый голос
      vote = await prisma.reviewVote.create({
        data: {
          isUpvote,
          user: {
            connect: { id: userId },
          },
          review: {
            connect: { id: reviewId },
          },
        },
      });
    }

    // Обновляем счетчик голосов отзыва
    await updateReviewVoteCount(reviewId);

    res.status(200).json({
      success: true,
      vote,
      message: `Review ${isUpvote ? "upvoted" : "downvoted"} successfully`,
    });
  } catch (error) {
    console.error("Error voting review:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Получение голоса пользователя для отзыва
export const getUserVote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const vote = await prisma.reviewVote.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    res.status(200).json({
      success: true,
      vote,
    });
  } catch (error) {
    console.error("Error getting user vote:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Удаление голоса пользователя
export const deleteVote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Проверяем, есть ли голос
    const vote = await prisma.reviewVote.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
    });

    if (!vote) {
      res.status(404).json({ success: false, message: "Vote not found" });
      return;
    }

    // Удаляем голос
    await prisma.reviewVote.delete({
      where: {
        id: vote.id,
      },
    });

    // Обновляем счетчик голосов отзыва
    await updateReviewVoteCount(reviewId);

    res.status(200).json({
      success: true,
      message: "Vote removed successfully",
    });
  } catch (error) {
    console.error("Error deleting vote:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
