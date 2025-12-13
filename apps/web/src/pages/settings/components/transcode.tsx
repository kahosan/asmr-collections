import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

import { SettingItem } from './setting-item';

import { toast } from 'sonner';
import useSWRImmutable from 'swr/immutable';

import { useTranscodeOptions } from '~/hooks/use-transcode-options';

import { notifyError } from '~/utils';
import { fetcher } from '~/lib/fetcher';

import type { TranscodeMode } from '~/hooks/use-transcode-options';

const bitrateOptions = [
  { label: '64 kbps', value: 64 },
  { label: '96 kbps', value: 96 },
  { label: '128 kbps', value: 128 },
  { label: '192 kbps', value: 192 },
  { label: '256 kbps', value: 256 },
  { label: '320 kbps', value: 320 }
];

export function TranscodeSettings({ disabled }: { disabled?: boolean }) {
  const [options, setOptions] = useTranscodeOptions();
  const { data, error, isLoading } = useSWRImmutable<{ exists: boolean }>('/api/library/ffmpeg', fetcher, {
    onError: e => notifyError(e, 'FFmpeg 状态获取失败')
  });

  const onValueChange = (value: string) => {
    const newValue = value as TranscodeMode;

    if (error)
      return notifyError(error, 'FFmpeg 状态获取失败');

    if (isLoading || !data)
      return toast.warning('正在获取 FFmpeg 状态，请稍后再试');

    if (!data.exists && newValue !== 'disable')
      return toast.error('FFmpeg 二进制不存在，无法启用转码功能');

    setOptions(d => {
      d.mode = newValue;
    });
  };

  const onBitrateChange = (value: string) => {
    setOptions(d => {
      d.bitrate = Number.parseInt(value, 10);
    });
  };

  return (
    <>
      <SettingItem
        id="storage-transcode-mode"
        disabled={disabled}
        description="仅对 WAV 以及 FLAC 格式的音频文件生效，不支持 WebDAV"
        action={
          <Select
            value={options.mode}
            onValueChange={onValueChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="persistence">持久启用</SelectItem>
                <SelectItem value="temporary">临时启用</SelectItem>
                <SelectItem value="disable">禁用</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      >
        启用转码功能
      </SettingItem>
      <SettingItem
        id="storage-transcode-bitrate"
        disabled={disabled}
        description="转码后音频的比特率，数值越大音质越好但文件体积也越大"
        action={
          <Select
            value={options.bitrate.toString()}
            onValueChange={onBitrateChange}
            disabled={disabled || options.mode === 'disable'}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {bitrateOptions.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      >
        转码比特率
      </SettingItem>
    </>
  );
}
