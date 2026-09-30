import { useState } from 'react';

import { toast } from 'sonner';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

import { SettingItem } from './setting-item';
import { SettingInput } from './setting-input';

interface Props {
  value: string
  onChange: (value: string) => void
}

const options = [
  { label: 'original', url: 'https://api.asmr.one' },
  { label: 'mirror-100', url: 'https://api.asmr-100.com' },
  { label: 'mirror-200', url: 'https://api.asmr-200.com' },
  { label: 'mirror-300', url: 'https://api.asmr-300.com' }
];

const customApisAtom = atomWithStorage<Array<{ label: string, url: string }>>('__asmr-one-custom-apis__', [], undefined, { getOnInit: true });

export function ASMRONEAPISettings({ value, onChange }: Props) {
  const [customApis, setCustomApis] = useAtom(customApisAtom);

  const [open, setOpen] = useState(false);

  const [label, setLabel] = useState('');
  const [input, setInput] = useState('');

  const allOptions = options.concat(customApis);

  function addApi() {
    const _label = label.trim();

    if (!_label) {
      toast.error('请输入端点名称');
      return;
    }

    let url: URL;
    try {
      url = new URL(input.trim());
    } catch {
      toast.error('请输入完整的 HTTP 或 HTTPS API 地址');
      return;
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      toast.error('请输入 HTTP 或 HTTPS API 地址');
      return;
    }

    const api = url.toString().replace(/\/+$/, '');
    if (allOptions.some(option => option.url === api)) {
      toast.error('该端点已存在');
      return;
    }

    setCustomApis(previous => [...previous, { label: _label, url: api }]);
    onChange(api);
    setOpen(false);
  }

  function deleteApi(url: string) {
    setCustomApis(previous => previous.filter(api => api.url !== url));
    if (value === url) onChange(options[0].url);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SettingItem
        id="asmr-one-api"
        name="ASMR.ONE API 地址"
        description="选择用于获取 ASMR.ONE 数据的 API 地址"
        action={
          <Select
            value={value}
            onValueChange={value => {
              if (value === 'add-endpoint') {
                setLabel('');
                setInput('');
                setOpen(true);
                return;
              }
              onChange(value);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              onCloseAutoFocus={event => {
                if (open) event.preventDefault();
              }}
            >
              {allOptions.map(option => (
                <SelectItem key={option.url} value={option.url} title={option.url}>
                  {option.label}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value="add-endpoint">添加端点</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        选择 ASMR.ONE API 地址
      </SettingItem>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加端点</DialogTitle>
          <DialogDescription>填写端点名称和 API 地址。</DialogDescription>
        </DialogHeader>
        <SettingInput id="custom-api-label" value={label} onChange={event => setLabel(event.target.value)}>
          名称
        </SettingInput>
        <SettingInput
          id="custom-api-url"
          type="url"
          placeholder="https://api.asmr.one"
          value={input}
          onChange={event => setInput(event.target.value)}
        >
          地址
        </SettingInput>
        {customApis.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {customApis.map(api => (
                  <div key={api.url} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate" title={api.label}>{api.label}</p>
                      <p className="truncate text-xs text-muted-foreground" title={api.url}>{api.url}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => deleteApi(api.url)} aria-label={`删除端点 ${api.label}`}>
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">返回</Button>
          </DialogClose>
          <Button onClick={addApi}>添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
