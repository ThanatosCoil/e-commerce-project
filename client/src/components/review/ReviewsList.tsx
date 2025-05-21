import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Star,
  Trash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Review } from "@/types/review";
import { useState } from "react";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import { motion } from "framer-motion";
import ReviewVote from "./ReviewVote";
import { useSelector } from "react-redux";

interface ReviewsListProps {
  reviews: Review[];
  onOpenReviewModal: () => void;
  userReview: Review | null;
  onDeleteReview?: (reviewId: string) => Promise<void>;
}

export default function ReviewsList({
  reviews,
  onOpenReviewModal,
  userReview,
  onDeleteReview,
}: ReviewsListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  // Состояние для хранения ID развернутых отзывов
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});

  // Получаем текущего пользователя из Redux Store
  const user = useSelector((state: any) => state.auth?.user);
  const currentUserId = user?.id || null;

  const handleDeleteClick = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete || !onDeleteReview) return;

    setIsDeleting(true);
    try {
      await onDeleteReview(reviewToDelete);
    } catch (error) {
      console.error("Failed to delete review:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  // Переключение состояния развернутости отзыва
  const toggleReviewExpanded = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // Проверка, нужно ли отображать кнопку "Show more"
  const shouldShowExpandButton = (review: Review) => {
    const hasLongContent =
      (review.pros && review.pros.length > 100) ||
      (review.cons && review.cons.length > 100) ||
      (review.comment && review.comment.length > 100) ||
      (review.pros?.length || 0) +
        (review.cons?.length || 0) +
        (review.comment?.length || 0) >
        200;

    return hasLongContent;
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No reviews yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Be the first to share your thoughts on this product
        </p>
        <Button
          onClick={onOpenReviewModal}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-800 dark:hover:to-indigo-900 text-white"
        >
          Write a review
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {reviews.map((review) => {
        const isExpanded = expandedReviews[review.id];
        const showExpandButton = shouldShowExpandButton(review);

        return (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center mb-1">
                  <span className="font-medium text-gray-900 dark:text-white mr-2">
                    {review.isAnonymous
                      ? "Anonymous"
                      : review.user?.name || review.userName || "User"}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(
                      review.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Кнопки управления или голосования */}
              {userReview && review.userId === userReview.userId ? (
                // Показывать кнопки Edit и Delete для своих отзывов
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenReviewModal()}
                    className="text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/60 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(review.id)}
                    className="text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/60 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // Показывать компонент голосования для чужих отзывов
                <ReviewVote
                  reviewId={review.id}
                  voteCount={review.voteCount || 0}
                  authorId={review.userId}
                  currentUserId={currentUserId}
                />
              )}
            </div>

            {/* Контейнер для содержимого отзыва с анимацией через framer-motion */}
            <div className="relative">
              <motion.div
                initial={false}
                animate={{
                  height: isExpanded || !showExpandButton ? "auto" : "150px",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                {/* Контент отзыва */}
                {review.pros && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Pros:
                    </h4>
                    <p className="text-gray-900 dark:text-gray-200 text-sm">
                      {review.pros}
                    </p>
                  </div>
                )}

                {review.cons && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Cons:
                    </h4>
                    <p className="text-gray-900 dark:text-gray-200 text-sm">
                      {review.cons}
                    </p>
                  </div>
                )}

                {review.comment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Comment:
                    </h4>
                    <p className="text-gray-900 dark:text-gray-200 text-sm">
                      {review.comment}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Градиент с анимацией through framer-motion */}
              {showExpandButton && (
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isExpanded ? 0 : 1,
                  }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"
                ></motion.div>
              )}
            </div>

            {/* Кнопка Show more/Show less */}
            {showExpandButton && (
              <div className="flex justify-start mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleReviewExpanded(review.id)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-transparent dark:hover:bg-transparent flex items-center text-sm"
                >
                  {isExpanded ? (
                    <>
                      Show less <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        onDelete={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        itemType="review"
      />
    </div>
  );
}
