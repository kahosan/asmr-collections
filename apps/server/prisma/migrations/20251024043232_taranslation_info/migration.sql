-- CreateTable
CREATE TABLE "TranslationInfo" (
    "workId" TEXT NOT NULL,
    "isVolunteer" BOOLEAN NOT NULL,
    "isOriginal" BOOLEAN NOT NULL,
    "isParent" BOOLEAN NOT NULL,
    "isChild" BOOLEAN NOT NULL,
    "isTranslationBonusChild" BOOLEAN NOT NULL,
    "originalWorkno" TEXT,
    "parentWorkno" TEXT,
    "childWorknos" TEXT[],
    "lang" TEXT,

    CONSTRAINT "TranslationInfo_pkey" PRIMARY KEY ("workId")
);

-- AddForeignKey
ALTER TABLE "TranslationInfo" ADD CONSTRAINT "TranslationInfo_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
