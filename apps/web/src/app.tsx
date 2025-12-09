import Works from './components/works';
import PreloadNextWorks from './components/works/preload-next';

import { useSearch } from '@tanstack/react-router';
import { withQuery } from '@asmr-collections/shared';

export default function App() {
  const _search = useSearch({ from: '/' });

  // 确保 limit 和 page 在最后面，防止 key 变化
  const { page, limit, ...rest } = _search;
  const search = { ...rest, limit, page };

  const key = withQuery('/api/works', search);
  const nextKey = withQuery('/api/works', { ...search, page: search.page + 1 });

  return (
    <>
      <Works swrKey={key} />
      {/** 预渲染下一页的数据 */}
      <div className="hidden" aria-hidden="true">
        <PreloadNextWorks swrKey={nextKey} />
      </div>
    </>
  );
}
