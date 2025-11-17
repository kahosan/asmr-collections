-- CreateTable
CREATE TABLE "SubtitlesData" (
    "workId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "SubtitlesData_pkey" PRIMARY KEY ("workId")
);

-- AddForeignKey
ALTER TABLE "SubtitlesData" ADD CONSTRAINT "SubtitlesData_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData
INSERT INTO "SubtitlesData" ("workId", "data") SELECT "id", "subtitles" FROM "Work" WHERE "subtitles" IS NOT NULL;

-- AddTempColumn
ALTER TABLE "Work" ADD COLUMN "subtitles_new" BOOLEAN NOT NULL DEFAULT false;

-- MigrateData
UPDATE "Work" SET "subtitles_new" = true WHERE "id" IN (SELECT "workId" FROM "SubtitlesData");

-- AlterTable
ALTER TABLE "Work" DROP COLUMN "subtitles";
ALTER TABLE "Work" RENAME COLUMN "subtitles_new" TO "subtitles";