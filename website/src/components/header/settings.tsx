import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { toast } from 'sonner';
import { useCallback, useState } from 'react';

import { useSettingOptions } from '~/hooks/use-setting-options';
import { useToastMutation } from '~/hooks/use-toast-fetch';

import type { SettingOptions } from '~/hooks/use-setting-options';

import { logger } from '~/lib/logger';

export default function SettingsDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [_options, _handleSave] = useSettingOptions();

  const [options, setOptions] = useState(_options);

  const voiceLibOps = options.voiceLibraryOptions;

  const updateOption = useCallback(<K extends keyof SettingOptions>(key: K, value: SettingOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: typeof value === 'string' ? value.trim() : value }));
  }, []);

  const updateVoiceLibOption = useCallback(<K extends keyof SettingOptions['voiceLibraryOptions']>(
    key: K,
    value: SettingOptions['voiceLibraryOptions'][K]
  ) => {
    setOptions(prev => ({
      ...prev,
      voiceLibraryOptions: {
        ...prev.voiceLibraryOptions,
        [key]: value
      }
    }));
  }, []);

  const handleSave = useCallback(() => {
    toast.success('保存成功');
    _handleSave(options);
    setOpen(false);
  }, [_handleSave, options, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        ref={e => {
          const timer = requestAnimationFrame(() => e?.focus({ preventScroll: true }));
          return () => cancelAnimationFrame(timer);
        }}
        className="rounded-lg max-w-[90%] sm:max-w-lg"
        onInteractOutside={e => e.preventDefault()}
        onOpenAutoFocus={event => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>设置选项</DialogTitle>
          <DialogDescription className="sr-only">
            在此处配置设置选项
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4.5 mt-4">
          <SettingInput
            id="kikoeru"
            name="kikoeru"
            placeholder={options.kikoeru}
            value={options.kikoeru}
            onChange={e => updateOption('kikoeru', e.target.value)}
          >
            自建 Kikoeru 地址
          </SettingInput>
          <SettingInput
            id="asmr-one-api"
            name="asmr-one-api"
            placeholder={options.asmrOneApi}
            value={options.asmrOneApi}
            onChange={e => updateOption('asmrOneApi', e.target.value)}
          >
            ASMR.ONE API
          </SettingInput>
          <Separator />
          <SettingItem
            id="show-work-details"
            checked={options.showWorkDetail}
            onCheckedChange={checked => updateOption('showWorkDetail', checked)}
          >
            作品详情页显示详细信息
          </SettingItem>
          <Separator />
          <SettingItem
            id="use-local-voice-library"
            checked={voiceLibOps.useLocalVoiceLibrary}
            onCheckedChange={checked => {
              updateVoiceLibOption('useLocalVoiceLibrary', checked);
              if (!checked) updateVoiceLibOption('showMissingTagsInLocalVL', false);
            }}
          >
            使用本地音声库
          </SettingItem>
          <SettingItem
            id="is-use-local-vl-show-exist-tag"
            checked={voiceLibOps.showMissingTagsInLocalVL}
            onCheckedChange={checked => updateVoiceLibOption('showMissingTagsInLocalVL', checked)}
            disabled={!voiceLibOps.useLocalVoiceLibrary}
          >
            当启用本地库时显示不存在于本地库的标签
          </SettingItem>
          <SettingItem
            id="fallback-to-asmrone-api"
            checked={voiceLibOps.fallbackToAsmrOneApi}
            onCheckedChange={checked => updateVoiceLibOption('fallbackToAsmrOneApi', checked)}
            disabled={!voiceLibOps.useLocalVoiceLibrary}
          >
            无法在本地库中找到音声时使用 ASMR.ONE
          </SettingItem>
        </div>
        <Separator />
        <div>
          <LibrarySyncTooltip useLib={voiceLibOps.useLocalVoiceLibrary} />
        </div>
        <Separator />
        <div className="flex gap-2">
          <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 px-0">
            <a href="https://github.com/kahosan/asmr-collections" target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
          </Button>
          <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 px-0">
            <a href="https://asmr.one" target="_blank" rel="noreferrer noopener">
              ASMR.ONE
            </a>
          </Button>
          <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 px-0">
            <a href="https://dlsite.com" target="_blank" rel="noreferrer noopener">
              DLsite
            </a>
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>
            保存
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              返回
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingItem({ id, children, ...props }: React.ComponentPropsWithoutRef<typeof Switch>) {
  return (
    <div className="flex justify-between">
      <Label htmlFor={id} className={props.disabled ? 'opacity-60' : ''}>{children}</Label>
      <Switch
        id={id}
        {...props}
      />
    </div>
  );
}

function SettingInput({ id, children, ...props }: React.ComponentPropsWithoutRef<typeof Input>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{children}</Label>
      <Input
        id={id}
        {...props}
      />
    </div>
  );
};

function LibrarySyncTooltip({ useLib }: { useLib: boolean }) {
  const [syncAction, syncIsMutating] = useToastMutation<{
    message: string
    data: Record<'faileds' | 'successes', string[]>
  }>('sync');

  const onClick = () => {
    syncAction({
      key: '/api/library/sync',
      fetchOps: { method: 'POST' },
      toastOps: {
        success(data) {
          return data.message;
        },
        description(data) {
          if (data.data.faileds.length !== 0 || data.data.successes.length !== 0) {
            logger.info(data);
            return '查看控制台了解详情';
          }

          return data.message;
        },
        loading: '同步中...',
        error: '同步失败'
      }
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" onClick={onClick} disabled={syncIsMutating || !useLib}>同步音声库</Button>
      </TooltipTrigger>
      <TooltipContent>
        当启用本地库时，点击此按钮可以将本地库内的作品同步到数据库中
      </TooltipContent>
    </Tooltip>
  );
}
