-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('WANT_TO_READ', 'READING', 'FINISHED', 'STOPPED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'JOIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" VARCHAR(20) NOT NULL,
    "profileImage" TEXT,
    "bio" VARCHAR(160),
    "yearlyGoalBooks" INTEGER NOT NULL DEFAULT 12,
    "monthlyGoalPages" INTEGER NOT NULL DEFAULT 1000,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookshelf" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "description" VARCHAR(300),
    "coverImage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "theme" VARCHAR(30) NOT NULL DEFAULT 'cream',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookshelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "author" VARCHAR(120) NOT NULL,
    "publisher" VARCHAR(120),
    "coverImage" TEXT,
    "totalPages" INTEGER NOT NULL,
    "titleKey" VARCHAR(330) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookshelfId" TEXT,
    "bookId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "oneLineReview" VARCHAR(150),
    "startDate" DATE,
    "finishDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingLog" (
    "id" TEXT NOT NULL,
    "readingRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pagesRead" INTEGER NOT NULL,
    "memo" VARCHAR(200),
    "isAuto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "sharedBookshelfId" TEXT,
    "title" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedBookshelf" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "description" VARCHAR(300),
    "coverImage" TEXT,
    "inviteCode" VARCHAR(16) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedBookshelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedBookshelfMember" (
    "id" TEXT NOT NULL,
    "bookshelfId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedBookshelfMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedBookshelfItem" (
    "id" TEXT NOT NULL,
    "bookshelfId" TEXT NOT NULL,
    "readingRecordId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedBookshelfItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookshelfDecoration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookshelfId" TEXT NOT NULL,
    "theme" VARCHAR(30) NOT NULL DEFAULT 'cream',
    "background" JSONB NOT NULL,
    "decorations" JSONB NOT NULL,
    "layout" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookshelfDecoration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "reviewId" TEXT,
    "sharedBookshelfId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE INDEX "Bookshelf_ownerId_createdAt_idx" ON "Bookshelf"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "Bookshelf_isPublic_createdAt_idx" ON "Bookshelf"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_author_idx" ON "Book"("author");

-- CreateIndex
CREATE UNIQUE INDEX "Book_createdById_titleKey_key" ON "Book"("createdById", "titleKey");

-- CreateIndex
CREATE INDEX "ReadingRecord_bookshelfId_idx" ON "ReadingRecord"("bookshelfId");

-- CreateIndex
CREATE INDEX "ReadingRecord_userId_status_idx" ON "ReadingRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "ReadingRecord_userId_finishDate_idx" ON "ReadingRecord"("userId", "finishDate");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingRecord_userId_bookId_key" ON "ReadingRecord"("userId", "bookId");

-- CreateIndex
CREATE INDEX "ReadingLog_userId_date_idx" ON "ReadingLog"("userId", "date");

-- CreateIndex
CREATE INDEX "ReadingLog_readingRecordId_date_idx" ON "ReadingLog"("readingRecordId", "date");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_bookId_idx" ON "Review"("bookId");

-- CreateIndex
CREATE INDEX "Review_isPublic_createdAt_idx" ON "Review"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "Review_sharedBookshelfId_createdAt_idx" ON "Review"("sharedBookshelfId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharedBookshelf_inviteCode_key" ON "SharedBookshelf"("inviteCode");

-- CreateIndex
CREATE INDEX "SharedBookshelf_ownerId_idx" ON "SharedBookshelf"("ownerId");

-- CreateIndex
CREATE INDEX "SharedBookshelf_isPublic_createdAt_idx" ON "SharedBookshelf"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "SharedBookshelfMember_userId_idx" ON "SharedBookshelfMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedBookshelfMember_bookshelfId_userId_key" ON "SharedBookshelfMember"("bookshelfId", "userId");

-- CreateIndex
CREATE INDEX "SharedBookshelfItem_addedById_idx" ON "SharedBookshelfItem"("addedById");

-- CreateIndex
CREATE UNIQUE INDEX "SharedBookshelfItem_bookshelfId_readingRecordId_key" ON "SharedBookshelfItem"("bookshelfId", "readingRecordId");

-- CreateIndex
CREATE INDEX "Like_reviewId_idx" ON "Like"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_reviewId_key" ON "Like"("userId", "reviewId");

-- CreateIndex
CREATE INDEX "Comment_reviewId_createdAt_idx" ON "Comment"("reviewId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookshelfDecoration_bookshelfId_key" ON "BookshelfDecoration"("bookshelfId");

-- CreateIndex
CREATE INDEX "BookshelfDecoration_userId_idx" ON "BookshelfDecoration"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "Bookshelf" ADD CONSTRAINT "Bookshelf_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingRecord" ADD CONSTRAINT "ReadingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingRecord" ADD CONSTRAINT "ReadingRecord_bookshelfId_fkey" FOREIGN KEY ("bookshelfId") REFERENCES "Bookshelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingRecord" ADD CONSTRAINT "ReadingRecord_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingLog" ADD CONSTRAINT "ReadingLog_readingRecordId_fkey" FOREIGN KEY ("readingRecordId") REFERENCES "ReadingRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingLog" ADD CONSTRAINT "ReadingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sharedBookshelfId_fkey" FOREIGN KEY ("sharedBookshelfId") REFERENCES "SharedBookshelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBookshelf" ADD CONSTRAINT "SharedBookshelf_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBookshelfMember" ADD CONSTRAINT "SharedBookshelfMember_bookshelfId_fkey" FOREIGN KEY ("bookshelfId") REFERENCES "SharedBookshelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBookshelfMember" ADD CONSTRAINT "SharedBookshelfMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBookshelfItem" ADD CONSTRAINT "SharedBookshelfItem_bookshelfId_fkey" FOREIGN KEY ("bookshelfId") REFERENCES "SharedBookshelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBookshelfItem" ADD CONSTRAINT "SharedBookshelfItem_readingRecordId_fkey" FOREIGN KEY ("readingRecordId") REFERENCES "ReadingRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedBookshelfItem" ADD CONSTRAINT "SharedBookshelfItem_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookshelfDecoration" ADD CONSTRAINT "BookshelfDecoration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookshelfDecoration" ADD CONSTRAINT "BookshelfDecoration_bookshelfId_fkey" FOREIGN KEY ("bookshelfId") REFERENCES "Bookshelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sharedBookshelfId_fkey" FOREIGN KEY ("sharedBookshelfId") REFERENCES "SharedBookshelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;
