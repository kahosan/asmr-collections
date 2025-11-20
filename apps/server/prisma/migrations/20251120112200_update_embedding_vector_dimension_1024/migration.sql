-- AlterTable: Update embedding column to use vector(1024)
ALTER TABLE "Work" ALTER COLUMN "embedding" TYPE vector(1024);