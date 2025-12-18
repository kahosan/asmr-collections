-- AlterTable
ALTER TABLE "Playback" ADD COLUMN     "tracks" JSONB[] DEFAULT ARRAY[]::JSONB[];
