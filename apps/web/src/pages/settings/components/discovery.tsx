import { useCallback } from 'react';

import useSWR from 'swr';
import { useImmerAtom } from 'jotai-immer';

import { Button } from '~/components/ui/button';
import { FilterPanel } from '~/components/header/filter-menu/filter-panel';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Separator } from '~/components/ui/separator';

import { SettingInput } from './setting-input';
import { SettingItem } from './setting-item';

import { fetcher } from '~/lib/fetcher';
import { notifyError } from '~/utils';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import type { Data } from '@asmr-collections/shared';

interface EntityPickerProps<T extends string | number> {
  endpoint: string
  label: string
  placeholder: string
  selected: T[]
  onChange: (ids: T[]) => void
  errorText: string
  description?: string
}

function EntityPicker<T extends string | number>({
  endpoint,
  label,
  placeholder,
  selected,
  onChange,
  errorText,
  description
}: EntityPickerProps<T>) {
  const { data, error, isLoading } = useSWR<Array<Data<T>>>(endpoint, fetcher, {
    onError: value => notifyError(value, errorText)
  });

  const handleSelect = useCallback((id: T) => {
    onChange(selected.includes(id)
      ? selected.filter(value => value !== id)
      : [...selected, id]);
  }, [onChange, selected]);

  const isChecked = useCallback(({ id }: Data<T>) => selected.includes(id), [selected]);

  return (
    <div className="space-y-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            <span className="truncate">{label}</span>
            <span className="text-muted-foreground text-xs">{selected.length ? `${selected.length} 项` : '全部适用'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <span className="text-muted-foreground text-xs">
              {selected.length ? `已选 ${selected.length} 项` : '全部适用'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
            >
              清空选择
            </Button>
          </div>
          <FilterPanel
            placeholder={placeholder}
            isLoading={isLoading}
            error={error}
            errorText={errorText}
            data={data}
            handleSelect={handleSelect}
            selectedData={selected}
            isCheck={isChecked}
          />
        </PopoverContent>
      </Popover>
      {description && <p className="text-muted-foreground text-xs">{description}</p>}
    </div>
  );
}

export function DiscoverySettings() {
  const [options, setOptions] = useImmerAtom(settingOptionsAtom);
  const discovery = options.discovery;

  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">发现设置</h2>
          <p className="text-muted-foreground text-xs mt-1">影响今日推荐、猜你喜欢和智能随机；外部热门来源按来源榜单顺序展示。</p>
        </div>

        <SettingItem
          id="discovery-smart-random"
          description="让“随心听”参考播放历史和多样性规则"
          checked={discovery.smartRandom}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.smartRandom = checked;
          })}
        >
          使用智能随机
        </SettingItem>

        <SettingItem
          id="discovery-source"
          description="ASMR.ONE 来源会读取其热门作品，并只展示本库中已有的作品"
          action={(
            <Select
              value={discovery.source}
              onValueChange={value => {
                if (value !== 'personal' && value !== 'asmrone') return;
                setOptions(d => {
                  d.discovery.source = value;
                });
              }}
            >
              <SelectTrigger id="discovery-source" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">猜你喜欢</SelectItem>
                <SelectItem value="asmrone">ASMR.ONE</SelectItem>
              </SelectContent>
            </Select>
          )}
        >
          每日推荐来源
        </SettingItem>

        <div className="grid grid-cols-2 gap-4">
          <SettingInput
            id="discovery-daily-count"
            type="number"
            min={1}
            max={50}
            value={discovery.dailyCount}
            onChange={event => {
              const value = Number.parseInt(event.target.value, 10);
              setOptions(d => {
                d.discovery.dailyCount = Math.min(Math.max(value, 1), 50);
              });
            }}
          >
            每日推荐数量
          </SettingInput>
          <SettingInput
            id="discovery-recent-exclude-days"
            type="number"
            min={0}
            max={3650}
            value={discovery.recentExcludeDays}
            onChange={event => {
              const value = Number.parseInt(event.target.value, 10);
              setOptions(d => {
                d.discovery.recentExcludeDays = Math.min(value, 3650);
              });
            }}
          >
            最近播放排除天数
          </SettingInput>
        </div>

        <SettingItem
          id="discovery-avoid-circle"
          checked={discovery.avoidDuplicateCircle}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.avoidDuplicateCircle = checked;
          })}
        >
          避免重复社团
        </SettingItem>
        <EntityPicker
          endpoint="/api/field/circle"
          label="适用去重规则的社团"
          placeholder="搜索社团..."
          selected={discovery.circleIds}
          onChange={ids => setOptions(d => { d.discovery.circleIds = ids; })}
          errorText="获取社团列表失败"
          description="未选择时默认对全部社团应用去重规则"
        />

        <SettingItem
          id="discovery-avoid-artist"
          checked={discovery.avoidDuplicateArtist}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.avoidDuplicateArtist = checked;
          })}
        >
          避免重复声优
        </SettingItem>
        <EntityPicker
          endpoint="/api/field/artist"
          label="适用去重规则的声优"
          placeholder="搜索声优..."
          selected={discovery.artistIds}
          onChange={ids => setOptions(d => { d.discovery.artistIds = ids; })}
          errorText="获取声优列表失败"
          description="未选择时默认对全部声优应用去重规则"
        />

        <SettingItem
          id="discovery-avoid-series"
          checked={discovery.avoidDuplicateSeries}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.avoidDuplicateSeries = checked;
          })}
        >
          避免重复系列
        </SettingItem>

        <SettingItem
          id="discovery-force-genre"
          description="尽量让不同标签出现在同一批推荐中"
          checked={discovery.forceGenreSpread}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.forceGenreSpread = checked;
          })}
        >
          分散标签
        </SettingItem>
        <EntityPicker
          endpoint="/api/field/genre"
          label="适用规则的标签"
          placeholder="搜索 标签..."
          selected={discovery.genreIds}
          onChange={ids => setOptions(d => { d.discovery.genreIds = ids; })}
          errorText="获取标签列表失败"
        />

        <SettingItem
          id="discovery-avoid-work-type"
          description="作品类型：RJ、BJ、VJ"
          checked={discovery.avoidDuplicateWorkType}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.avoidDuplicateWorkType = checked;
          })}
        >
          分散作品类型
        </SettingItem>
        <SettingItem
          id="discovery-avoid-age"
          description="全年龄、R15、R18"
          checked={discovery.avoidDuplicateAgeCategory}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.avoidDuplicateAgeCategory = checked;
          })}
        >
          分散年龄分类
        </SettingItem>

        <SettingItem
          id="discovery-storage-only"
          description="只从已配置存储中存在的作品里推荐"
          checked={discovery.storageOnly}
          onCheckedChange={checked => setOptions(d => {
            d.discovery.storageOnly = checked;
          })}
        >
          只推荐本地存在的作品
        </SettingItem>
      </div>
    </>
  );
}
