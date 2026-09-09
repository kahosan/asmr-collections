import { useImmerAtom } from 'jotai-immer';

import { EntityPicker } from '~/components/discovery/entity-picker';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

export function PersonalGenreFilter() {
  const [options, setOptions] = useImmerAtom(settingOptionsAtom);

  return (
    <EntityPicker
      endpoint="/api/field/genre"
      label="屏蔽标签"
      placeholder="搜索要屏蔽的标签..."
      selected={options.discovery.personal.blockedGenreIds}
      onChange={ids => setOptions(d => {
        d.discovery.personal.blockedGenreIds = ids;
      })}
      errorText="获取标签列表失败"
      emptyLabel="未屏蔽"
      description="仅用于猜你喜欢。包含任一所选标签的作品会被排除，刷新后仍保留此设置。"
      inline
    />
  );
}
