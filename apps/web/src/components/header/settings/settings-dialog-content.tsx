import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { ScrollArea } from '~/components/ui/scroll-area';
import { AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/ui/alert-dialog';

import { toast } from 'sonner';
import { useImmer } from 'use-immer';

import { useSettingOptions } from '~/hooks/use-setting-options';

import { SettingItem } from './setting-item';
import { SettingInput } from './setting-input';
import { SmartPathSettings } from './smart-path-settings';

export function SettingsDialogContent({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [rawOptions, setRawOptions] = useSettingOptions();

  const [options, setOptions] = useImmer(rawOptions);

  const voiceLibOps = options.voiceLibraryOptions;

  const handleSave = () => {
    const pattern = options.smartPath.pattern.reduce<string[]>((acc, cur) => {
      const trimmed = cur.trim();
      if (trimmed !== '') acc.push(trimmed);
      return acc;
    }, []);

    const newOptions = {
      ...options,
      smartPath: { ...options.smartPath, pattern }
    };

    setRawOptions(newOptions);
    setOpen(false);
    toast.success('保存成功');
  };

  return (
    <>
      <AlertDialogHeader className="px-6">
        <AlertDialogTitle>设置选项</AlertDialogTitle>
        <AlertDialogDescription className="sr-only">
          在此处配置设置选项
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ScrollArea className="h-[70dvh]" type="auto">
        <div className="flex flex-col gap-4.5 mt-4 px-6">

          <SettingInput
            id="kikoeru"
            name="kikoeru"
            placeholder={options.kikoeru}
            value={options.kikoeru}
            onChange={e => setOptions(d => {
              d.kikoeru = e.target.value;
            })}
          >
            自建 Kikoeru 地址
          </SettingInput>
          <SettingInput
            id="asmr-one-api"
            name="asmr-one-api"
            placeholder={options.asmrOneApi}
            value={options.asmrOneApi}
            onChange={e => setOptions(d => {
              d.asmrOneApi = e.target.value;
            })}
          >
            ASMR.ONE API
          </SettingInput>

          <Separator />

          <SettingItem
            id="use-asmr-one-recommender"
            checked={options.useAsmrOneRecommender}
            onCheckedChange={checked => setOptions(d => {
              d.useAsmrOneRecommender = checked;
            })}
          >
            使用 ASMR.ONE 的推荐
          </SettingItem>

          <SettingItem
            id="show-work-details"
            checked={options.showWorkDetail}
            onCheckedChange={checked => setOptions(d => {
              d.showWorkDetail = checked;
            })}
          >
            作品详情页显示详细信息
          </SettingItem>

          <SmartPathSettings
            options={options.smartPath}
            setOptions={(key, value) => setOptions(d => {
              d.smartPath[key] = value;
            })}
          />

          <Separator />

          <SettingItem
            id="use-local-voice-library"
            checked={voiceLibOps.useLocalVoiceLibrary}
            onCheckedChange={checked => {
              setOptions(d => {
                d.voiceLibraryOptions.useLocalVoiceLibrary = checked;
                if (!checked)
                  d.voiceLibraryOptions.showMissingTagsInLocalVL = false;
              });
            }}
          >
            使用本地音声库
          </SettingItem>
          <SettingItem
            id="is-use-local-vl-show-exist-tag"
            checked={voiceLibOps.showMissingTagsInLocalVL}
            onCheckedChange={checked => setOptions(d => {
              d.voiceLibraryOptions.showMissingTagsInLocalVL = checked;
            })}
            disabled={!voiceLibOps.useLocalVoiceLibrary}
          >
            当启用本地库时显示不存在于本地库的标签
          </SettingItem>
          <SettingItem
            id="fallback-to-asmrone-api"
            checked={voiceLibOps.fallbackToAsmrOneApi}
            onCheckedChange={checked => setOptions(d => {
              d.voiceLibraryOptions.fallbackToAsmrOneApi = checked;
            })}
            disabled={!voiceLibOps.useLocalVoiceLibrary}
          >
            无法在本地库中找到音声时使用 ASMR.ONE
          </SettingItem>

          <Separator />
          <div className="flex gap-2">
            <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 p-1">
              <a href="https://asmr.one" target="_blank" rel="noreferrer noopener">
                ASMR.ONE
              </a>
            </Button>
            <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 p-1">
              <a href="https://github.com/kahosan/asmr-collections" target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
            </Button>
            <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 p-1">
              <a href="https://dlsite.com" target="_blank" rel="noreferrer noopener">
                DLsite
              </a>
            </Button>
          </div>
        </div>
      </ScrollArea>
      <AlertDialogFooter className="px-6">
        <AlertDialogCancel>返回</AlertDialogCancel>
        <AlertDialogAction onClick={handleSave}>保存</AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
