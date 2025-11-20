/*
  Warnings:

  - Changed the type of `releaseDate` on the `Work` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable: 添加临时列
ALTER TABLE "Work" ADD COLUMN "releaseDate_new" TIMESTAMP(3);

-- 转换数据: 将字符串日期转换为 timestamp
UPDATE "Work" SET "releaseDate_new" = "releaseDate"::timestamp;

-- 删除旧列
ALTER TABLE "Work" DROP COLUMN "releaseDate";

-- 重命名新列并设置为 NOT NULL
ALTER TABLE "Work" RENAME COLUMN "releaseDate_new" TO "releaseDate";
ALTER TABLE "Work" ALTER COLUMN "releaseDate" SET NOT NULL;
