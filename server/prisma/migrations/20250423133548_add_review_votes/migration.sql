-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "voteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewVote_reviewId_idx" ON "ReviewVote"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_userId_reviewId_key" ON "ReviewVote"("userId", "reviewId");

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
