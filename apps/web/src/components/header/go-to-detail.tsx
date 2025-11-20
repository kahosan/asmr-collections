import { z } from 'zod';
import { useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { ArrowRight } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { InputGroup, InputGroupButton, InputGroupInput } from '~/components/ui/input-group';

const route = getRouteApi('/work-details/$id');

export default function GoToDetail() {
  const [id, setId] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = route.useNavigate();

  const disabled = !z.string().regex(/^(?:rj|bj|vj)\d{6,8}$/i).safeParse(id).success;

  const tooltip = id === '' ? '输入 ID 前往作品详情' : (disabled ? 'RJ 号格式错误' : '前往作品详情');

  const handleClick = () => {
    if (disabled) return;
    navigate({ params: { id: id.toUpperCase() } });
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5" onSelect={e => e.preventDefault()}>
      <InputGroup>
        <InputGroupInput
          id="go-to-detail-input"
          className="placeholder:text-sm w-30 text-sm"
          placeholder="RJ114514"
          onChange={e => setId(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={e => {
            if (e.key === 'Enter')
              handleClick();
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
              e.stopPropagation();
          }}
        />
        <Tooltip open={isFocused}>
          <TooltipTrigger asChild>
            <InputGroupButton onClick={handleClick}>
              <ArrowRight />
            </InputGroupButton>
          </TooltipTrigger>
          <TooltipContent>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </InputGroup>
    </div>
  );
}
