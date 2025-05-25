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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVote = exports.getUserVote = exports.voteReview = exports.deleteReview = exports.getUserReview = exports.getProductReviews = exports.createOrUpdateReview = void 0;
const server_1 = require("../server");
// Создание нового отзыва или обновление существующего
const createOrUpdateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId, rating, pros, cons, comment, isAnonymous } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
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
        const product = yield server_1.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // Проверяем, существует ли уже отзыв от этого пользователя
        const existingReview = yield server_1.prisma.review.findUnique({
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
            review = yield server_1.prisma.review.update({
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
        }
        else {
            // Создаем новый отзыв
            review = yield server_1.prisma.review.create({
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
        yield updateProductRating(productId);
        res.status(201).json({ success: true, review });
    }
    catch (error) {
        console.error("Error creating/updating review:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.createOrUpdateReview = createOrUpdateReview;
// Получение всех отзывов для продукта
const getProductReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        const reviews = yield server_1.prisma.review.findMany({
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
        const formattedReviews = reviews.map((review) => (Object.assign(Object.assign({}, review), { user: review.isAnonymous
                ? { id: review.userId, name: "Anonymous" }
                : review.user })));
        res.status(200).json({ success: true, reviews: formattedReviews });
    }
    catch (error) {
        console.error("Error getting product reviews:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getProductReviews = getProductReviews;
// Получение отзыва пользователя для продукта
const getUserReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const review = yield server_1.prisma.review.findUnique({
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
    }
    catch (error) {
        console.error("Error getting user review:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getUserReview = getUserReview;
// Удаление отзыва
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { reviewId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Проверяем, существует ли отзыв и принадлежит ли он пользователю
        const review = yield server_1.prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review) {
            res.status(404).json({ success: false, message: "Review not found" });
            return;
        }
        if (review.userId !== userId && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "SUPER_ADMIN") {
            res.status(403).json({
                success: false,
                message: "You are not authorized to delete this review",
            });
            return;
        }
        // Удаляем отзыв
        yield server_1.prisma.review.delete({
            where: { id: reviewId },
        });
        // Обновляем средний рейтинг продукта
        yield updateProductRating(review.productId);
        res
            .status(200)
            .json({ success: true, message: "Review deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.deleteReview = deleteReview;
// Вспомогательная функция для обновления среднего рейтинга продукта
const updateProductRating = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield server_1.prisma.review.findMany({
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
        yield server_1.prisma.product.update({
            where: {
                id: productId,
            },
            data: {
                rating: Math.round(averageRating * 10) / 10, // Округляем до 1 знака после запятой
            },
        });
    }
    else {
        // Если отзывов нет, устанавливаем рейтинг в 0
        yield server_1.prisma.product.update({
            where: {
                id: productId,
            },
            data: {
                rating: 0,
            },
        });
    }
});
// Обновляем количество голосов отзыва
const updateReviewVoteCount = (reviewId) => __awaiter(void 0, void 0, void 0, function* () {
    const votes = yield server_1.prisma.reviewVote.findMany({
        where: {
            reviewId,
        },
    });
    const upvotes = votes.filter((vote) => vote.isUpvote).length;
    const downvotes = votes.filter((vote) => !vote.isUpvote).length;
    const voteCount = upvotes - downvotes;
    yield server_1.prisma.review.update({
        where: {
            id: reviewId,
        },
        data: {
            voteCount,
        },
    });
});
// Голосование за отзыв (лайк/дизлайк)
const voteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        const { isUpvote } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
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
        const review = yield server_1.prisma.review.findUnique({
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
        const existingVote = yield server_1.prisma.reviewVote.findUnique({
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
            vote = yield server_1.prisma.reviewVote.update({
                where: {
                    id: existingVote.id,
                },
                data: {
                    isUpvote,
                },
            });
        }
        else {
            // Создаем новый голос
            vote = yield server_1.prisma.reviewVote.create({
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
        yield updateReviewVoteCount(reviewId);
        res.status(200).json({
            success: true,
            vote,
            message: `Review ${isUpvote ? "upvoted" : "downvoted"} successfully`,
        });
    }
    catch (error) {
        console.error("Error voting review:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.voteReview = voteReview;
// Получение голоса пользователя для отзыва
const getUserVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const vote = yield server_1.prisma.reviewVote.findUnique({
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
    }
    catch (error) {
        console.error("Error getting user vote:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getUserVote = getUserVote;
// Удаление голоса пользователя
const deleteVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        // Проверяем, есть ли голос
        const vote = yield server_1.prisma.reviewVote.findUnique({
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
        yield server_1.prisma.reviewVote.delete({
            where: {
                id: vote.id,
            },
        });
        // Обновляем счетчик голосов отзыва
        yield updateReviewVoteCount(reviewId);
        res.status(200).json({
            success: true,
            message: "Vote removed successfully",
        });
    }
    catch (error) {
        console.error("Error deleting vote:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.deleteVote = deleteVote;
