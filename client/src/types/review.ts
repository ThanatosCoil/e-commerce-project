export interface Review {
  id: string;
  userId: string;
  userName: string;
  isAnonymous: boolean;
  rating: number;
  pros: string;
  cons: string;
  comment: string;
  date: string;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  voteCount?: number;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  isUpvote: boolean;
  createdAt?: string;
  updatedAt?: string;
}
