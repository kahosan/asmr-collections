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
import { useToastFetch } from '~/hooks/use-toast-fetch';

export default function SettingsDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [_options, _handleSave] = useSettingOptions();
  const { isLoading, toastcher } = useToastFetch();

  const [options, setOptions] = useState(_options);

  const handleSave = useCallback(() => {
    toast.success('保存成功');
    _handleSave(options);
    setOpen(false);
  }, [_handleSave, options, setOpen]);

  const handleSync = useCallback(() => {
    toastcher<{ message: string, data: string[] }>('/api/library/sync', { method: 'POST' }, {
      success(data) {
        if (data.data.length > 0) {
          console.log(data.data);
          return data.message + ': 请查看控制台获取失败 ID';
        }
        return data.message;
      },
      loading: '同步中...'
    });
  }, [toastcher]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-lg max-w-[90%] sm:max-w-lg" onOpenAutoFocus={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>设置选项</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="kikoeru">自建 Kikoeru 地址</Label>
            <Input
              id="kikoeru"
              name="kikoeru"
              placeholder="https://asmr.one/work/"
              value={options.kikoeru}
              onChange={e => setOptions({ ...options, kikoeru: e.target.value })}
            />
          </div>
          <Separator />
          <SettingItem
            id="selected-close-menu"
            checked={options.selectedCloseMenu}
            onCheckedChange={checked => setOptions({ ...options, selectedCloseMenu: checked })}
          >
            选择菜单项后关闭浮窗
          </SettingItem>
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
            id="show-work-details"
            checked={options.showWorkDetail}
            onCheckedChange={checked => setOptions({ ...options, showWorkDetail: checked })}
          >
            作品详情页显示详细信息
          </SettingItem>
        </div>
        <Separator />
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleSync} disabled={isLoading || !options.useLocalVoiceLibrary}>同步音声库</Button>
            </TooltipTrigger>
            <TooltipContent>
              当启用本地库时，点击此按钮可以将本地库内的作品同步到数据库中
            </TooltipContent>
          </Tooltip>
        </div>
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
