-- Backfill: originals previously stored NULL, they now point to themselves
UPDATE "Work" SET "originalId" = "id" WHERE "originalId" IS NULL;

-- AlterTable
ALTER TABLE "Work" ALTER COLUMN "originalId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Work_originalId_idx" ON "Work"("originalId");
