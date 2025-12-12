import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

import { useTranscodeOptions } from '~/hooks/use-transcode-options';

import { cn } from '~/lib/utils';

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

  const onValueChange = (value: string) => {
    setOptions(d => {
      d.mode = value as TranscodeMode;
    });
  };

  const onBitrateChange = (value: string) => {
    setOptions(d => {
      d.bitrate = Number.parseInt(value, 10);
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <Label className={cn(disabled ? 'opacity-60' : '', 'max-w-[80%] leading-6 text-sm')}>
            启用转码功能
          </Label>
          <p className="opacity-60 text-xs">
            仅对 WAV 以及 FLAC 格式的音频文件生效，不支持 WebDAV
          </p>
        </div>
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
      </div>
      <div className="flex justify-between items-center">
        <Label className={cn(disabled ? 'opacity-60' : '', 'max-w-[80%] leading-6 text-sm')}>
          转码比特率
        </Label>
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
      </div>
    </>
  );
}
