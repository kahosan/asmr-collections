import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { toast } from 'sonner';
import { useCallback, useState } from 'react';

import { useSettingOptions } from '~/hooks/use-setting-options';
import { useToastMutation } from '~/hooks/use-toast-fetch';

import { logger } from '~/lib/logger';

export default function SettingsDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [_options, _handleSave] = useSettingOptions();
  const [syncAction, syncIsMutating] = useToastMutation<{
    message: string
    data: Record<'faileds' | 'successes', string[]>
  }>('sync');

  const [options, setOptions] = useState(_options);

  const handleSave = useCallback(() => {
    toast.success('保存成功');
    _handleSave(options);
    setOpen(false);
  }, [_handleSave, options, setOpen]);

  const handleSync = useCallback(() => {
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
  }, [syncAction]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="rounded-lg max-w-[90%] sm:max-w-lg"
        onInteractOutside={e => e.preventDefault()}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>设置选项</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4.5 mt-4">
          <SettingInput
            id="kikoeru"
            name="kikoeru"
            placeholder={options.kikoeru}
            value={options.kikoeru}
            onChange={e => setOptions({ ...options, kikoeru: e.target.value.trim() })}
          >
            自建 Kikoeru 地址
          </SettingInput>
          <SettingInput
            id="asmr-one-api"
            name="asmr-one-api"
            placeholder={options.asmrOneApi}
            value={options.asmrOneApi}
            onChange={e => setOptions({ ...options, asmrOneApi: e.target.value.trim() })}
          >
            ASMR.ONE API
          </SettingInput>
          <Separator />
          <SettingItem
            id="prioritize-dlsite"
            checked={options.prioritizeDLsite}
            onCheckedChange={checked => setOptions({ ...options, prioritizeDLsite: checked })}
          >
            优先使用 DLsite 数据源
          </SettingItem>
          <SettingItem
            id="show-work-details"
            checked={options.showWorkDetail}
            onCheckedChange={checked => setOptions({ ...options, showWorkDetail: checked })}
          >
            作品详情页显示详细信息
          </SettingItem>
          <Separator />
          <SettingItem
            id="use-local-voice-library"
            checked={options.useLocalVoiceLibrary}
            onCheckedChange={
              checked => setOptions({
                ...options,
                useLocalVoiceLibrary: checked,
                isUseLocalVLShowExistTag: false
              })
            }
          >
            使用本地音声库
          </SettingItem>
          <SettingItem
            id="is-use-local-vl-show-exist-tag"
            checked={options.isUseLocalVLShowExistTag}
            onCheckedChange={checked => setOptions({ ...options, isUseLocalVLShowExistTag: checked })}
            disabled={!options.useLocalVoiceLibrary}
          >
            当启用本地库时显示不存在于本地库的标签
          </SettingItem>
          <SettingItem
            id="fallback-to-asmrone-api"
            checked={options.fallbackToAsmrOneApi}
            onCheckedChange={checked => setOptions({ ...options, fallbackToAsmrOneApi: checked })}
            disabled={!options.useLocalVoiceLibrary}
          >
            无法在本地库中找到音声时使用 ASMR.ONE
          </SettingItem>
        </div>
        <Separator />
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleSync} disabled={syncIsMutating || !options.useLocalVoiceLibrary}>同步音声库</Button>
            </TooltipTrigger>
            <TooltipContent>
              当启用本地库时，点击此按钮可以将本地库内的作品同步到数据库中
            </TooltipContent>
          </Tooltip>
        </div>
        <Separator />
        <DialogFooter>
          <Button onClick={handleSave}>
            保存
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">
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
