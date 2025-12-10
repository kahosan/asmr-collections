import WorkCard from '../work-card';

import type { WorksResponse } from '@asmr-collections/shared';

interface WorksProps {
  data: WorksResponse
}

export default function Works({ data }: WorksProps) {
  if (data.data.length === 0)
    return <div className="flex justify-center opacity-70 mt-[10%]">没有更多惹...</div>;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-4">
      {data.data.map(work => (
        <div key={work.id}>
          <WorkCard work={work} />
        </div>
      ))}
    </div>
  );
}
