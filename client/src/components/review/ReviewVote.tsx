import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useVoteReviewMutation,
  useGetUserVoteQuery,
  useDeleteVoteMutation,
} from "@/store/api/apiSlice";
import { toast } from "sonner";

interface ReviewVoteProps {
  reviewId: string;
  voteCount: number;
  authorId: string;
  currentUserId?: string | null;
}

export default function ReviewVote({
  reviewId,
  voteCount,
  authorId,
  currentUserId,
}: ReviewVoteProps) {
  const [localVoteCount, setLocalVoteCount] = useState(voteCount || 0);
  const [userVoteStatus, setUserVoteStatus] = useState<
    "upvote" | "downvote" | null
  >(null);

  // Получаем информацию о голосе пользователя
  const { data: userVoteData, isLoading: isUserVoteLoading } =
    useGetUserVoteQuery(reviewId, {
      skip: !currentUserId || currentUserId === authorId,
    });

  // Мутации для голосования и отмены голоса
  const [voteReview] = useVoteReviewMutation();
  const [deleteVote] = useDeleteVoteMutation();

  // Обновляем локальное состояние при получении данных
  useEffect(() => {
    if (voteCount !== undefined) {
      setLocalVoteCount(voteCount);
    }
  }, [voteCount]);

  // Обновляем статус голоса пользователя при получении данных
  useEffect(() => {
    if (userVoteData?.success && userVoteData.vote) {
      setUserVoteStatus(userVoteData.vote.isUpvote ? "upvote" : "downvote");
    } else {
      setUserVoteStatus(null);
    }
  }, [userVoteData]);

  // Обработчик голосования
  const handleVote = async (isUpvote: boolean) => {
    if (!currentUserId) {
      toast.error("You need to be logged in to vote");
      return;
    }

    if (currentUserId === authorId) {
      toast.error("You cannot vote for your own review");
      return;
    }

    try {
      // Если уже голосовали таким же образом - удаляем голос
      if (
        (isUpvote && userVoteStatus === "upvote") ||
        (!isUpvote && userVoteStatus === "downvote")
      ) {
        await deleteVote(reviewId);
        // Обновляем локальное состояние
        setUserVoteStatus(null);
        setLocalVoteCount((prev) => (isUpvote ? prev - 1 : prev + 1));
      } else {
        // Если голосуем противоположно предыдущему голосу, меняем на 2 (удаляем старый, добавляем новый)
        const countChange = userVoteStatus !== null ? 2 : 1;

        await voteReview({ reviewId, isUpvote });

        // Обновляем локальное состояние
        setUserVoteStatus(isUpvote ? "upvote" : "downvote");
        setLocalVoteCount((prev) => {
          if (userVoteStatus === "upvote" && !isUpvote) {
            return prev - countChange;
          } else if (userVoteStatus === "downvote" && isUpvote) {
            return prev + countChange;
          } else {
            return isUpvote ? prev + 1 : prev - 1;
          }
        });
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="flex items-center gap-1 mt-4">
      <button
        onClick={() => handleVote(true)}
        disabled={
          isUserVoteLoading || !currentUserId || currentUserId === authorId
        }
        className={cn(
          "p-1 rounded transition-colors",
          userVoteStatus === "upvote"
            ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30"
            : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
        )}
        aria-label="Upvote"
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <span
        className={cn(
          "font-medium text-sm",
          localVoteCount > 0
            ? "text-green-600 dark:text-green-400"
            : localVoteCount < 0
            ? "text-red-600 dark:text-red-400"
            : "text-gray-500 dark:text-gray-400"
        )}
      >
        {localVoteCount}
      </span>

      <button
        onClick={() => handleVote(false)}
        disabled={
          isUserVoteLoading || !currentUserId || currentUserId === authorId
        }
        className={cn(
          "p-1 rounded transition-colors",
          userVoteStatus === "downvote"
            ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
            : "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
        )}
        aria-label="Downvote"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
