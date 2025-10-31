import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useIndexGenerateSearch } from '~/hooks/use-generate-search';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group';
import { Search, Zap, ZapOff } from 'lucide-react';

interface SearchBarProps {
  search: {
    keyword?: string
    embedding?: string
  }
}

export default function SearchBar({ search }: SearchBarProps) {
  const [keyword, setKeyword] = useState(() => search.keyword ?? '');
  const [isEmbedding, setIsEmbedding] = useState(() => !!search.embedding);

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
    <InputGroup className="max-w-52">
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          title="使用向量搜索"
          onClick={() => setIsEmbedding(p => !p)}
        >
          {
            isEmbedding ? <Zap className="text-accent-foreground" /> : <ZapOff />
          }
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput
        name="search"
        placeholder="Search..."
        value={keyword}
        onChange={e => setKeyword(e.target.value.trim())}
        onKeyUp={e => e.key === 'Enter' && onSearch()}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton onClick={onSearch}>
          <Search />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
