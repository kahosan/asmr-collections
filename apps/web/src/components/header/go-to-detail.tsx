import { useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { parseWorkInput } from '~/utils';
import WorkInput from '../work-input';

const route = getRouteApi('/work-details/$id');

export default function GoToDetail() {
  const [id, setId] = useState('');
  const navigate = route.useNavigate();

  const { validIds, isValid } = parseWorkInput(id);

  const handleClick = () => {
    if (!isValid) return;
    navigate({ params: { id: validIds.at(0) } });
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <WorkInput
        id="go-to-detail-input"
        className="w-30"
        placeholder="RJ114514"
        value={id}
        onValueChange={v => setId(v)}
        initialTip="输入 ID 前往作品详情"
        validTip="按回车或点击按钮前往"
        onKeyUp={e => {
          if (e.key === 'Enter')
            handleClick();
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
            e.stopPropagation();
        }}
        onButtonClick={handleClick}
      />
    </div>
  );
}
