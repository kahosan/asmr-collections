import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group';
import { Search, Zap, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  search: {
    keyword?: string
    embedding?: string
  }
}

export function SearchBar({ search }: SearchBarProps) {
  const [keyword, setKeyword] = useState(() => search.keyword ?? '');
  const [isEmbedding, setIsEmbedding] = useState(() => !!search.embedding);

  const navigate = useNavigate();

  const onSearch = () => {
    if (!keyword.trim()) return;

    if (isEmbedding)
      navigate({ to: '/', search: { embedding: keyword } });
    else
      navigate({ to: '/', search: { keyword } });
  };

  return (
    <InputGroup className="max-w-52">
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          title="使用向量搜索"
          onClick={() => setIsEmbedding(p => !p)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isEmbedding ? 'on' : 'off'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {isEmbedding ? <Zap className="text-accent-foreground" /> : <ZapOff />}
            </motion.div>
          </AnimatePresence>
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
