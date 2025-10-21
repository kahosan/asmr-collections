import { IconInput } from '../icon-input';

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useIndexGenerateSearch } from '~/hooks/use-generate-search';
import { Toggle } from '../ui/toggle';

export default function SearchBar() {
  const [keyword, setKeyword] = useState('');
  const [isEmbedding, setIsEmbedding] = useState(false);
  const { include } = useIndexGenerateSearch('__root__');
  const navigate = useNavigate({ from: '/' });

  const onSearch = () => {
    navigate({
      search: include(
        ['sort', 'order', 'filterOp'],
        { keyword, embedding: isEmbedding ? keyword : undefined }
      )
    });
  };

  return (
    <div className="flex items-center gap-2 mx-2">
      <Toggle
        className="px-1"
        variant="outline"
        aria-label="use embedding search"
        title="使用向量搜索"
        onClick={() => setIsEmbedding(!isEmbedding)}
        pressed={isEmbedding}
      >
        <div className="i-carbon-deployment-unit-execution cursor-pointer text-xl" />
      </Toggle>
      <IconInput
        title="可以使用 ID 或者名称搜索"
        icon={<div className="i-carbon-search cursor-pointer" onClick={onSearch} />}
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        onKeyUp={e => e.key === 'Enter' && onSearch()}
      />
    </div>
  );
}
