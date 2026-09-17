import { prisma } from '~/lib/db';

export const playlistRepo = {
  async addWorks(playlistId: string, workIds: string[]) {
    if (workIds.length === 0)
      return { count: 0 };

    return prisma.playlistWork.createMany({
      data: workIds.map(workId => ({ playlistId, workId })),
      skipDuplicates: true
    });
  }
};
