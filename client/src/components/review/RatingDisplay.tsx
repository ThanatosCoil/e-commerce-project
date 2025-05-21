import { Button } from "@/components/ui/button";
import { MessageSquare, Star, Edit2 } from "lucide-react";
import { Review } from "@/types/review";

interface RatingDisplayProps {
  rating: number;
  reviewCount: number;
  userReview: Review | null;
  onOpenReviewModal: () => void;
}

export default function RatingDisplay({
  rating,
  reviewCount,
  userReview,
  onOpenReviewModal,
}: RatingDisplayProps) {
  // Функция для плавного скролла к отзывам
  const scrollToReviews = () => {
    const reviewsSection = document.getElementById("reviews");
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col mb-5">
      <div className="flex items-center flex-wrap">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < Math.floor(rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : i < rating
                  ? "text-yellow-400 fill-yellow-400 opacity-50"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="ml-2 text-[15px] font-bold text-yellow-500 dark:text-yellow-400">
          {rating.toFixed(1)}
          <button
            onClick={scrollToReviews}
            className="text-gray-500 dark:text-gray-400 hover:underline focus:outline-none font-medium ml-1"
          >
            ({reviewCount} reviews)
          </button>
        </span>

        {userReview && (
          <div className="flex items-center flex-nowrap ml-2 mt-0 md:mt-0">
            <span className="font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
              • Your rating: {userReview.rating}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenReviewModal}
              className="ml-1 p-0.5 h-auto text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-transparent"
            >
              <Edit2 className="h-2 w-2" />
            </Button>
          </div>
        )}
      </div>

      {!userReview && (
        <Button
          variant="outline"
          onClick={onOpenReviewModal}
          className="mt-2 text-sm flex items-center w-fit"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Write a review
        </Button>
      )}
    </div>
  );
}
