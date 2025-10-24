import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu';

import { MenuIcon } from 'lucide-react';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { useAtomValue } from 'jotai';

import { useToastFetch } from '~/hooks/use-toast-fetch';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import { extractFileExt } from '~/lib/utils';

import type { Work } from '~/types/work';

interface Props {
  work: Work
}

export default function Menu({ work }: Props) {
  const [openAlert, setOpenAlert] = useState(false);
  const [open, setOpen] = useState(false);

  const settingOptions = useAtomValue(settingOptionsAtom);

  const [isLoading, toastcher] = useToastFetch();

  const refreshWork = () => {
    toastcher<Work>(
      `/api/work/refresh/${work.id}`,
      { method: 'PUT' },
      {
        loading: `${work.id} 数据更新中...`,
        success: `${work.id} 数据更新成功`,
        error: `${work.id} 数据更新失败`,
        finally() {
          setOpen(false);
          mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
        }
      }
    );
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            onPointerDown={e => e.preventDefault()}
            onClick={() => setOpen(p => !p)}
            size="lg"
            variant="outline"
            className="w-16"
          >
            <MenuIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" onInteractOutside={() => setOpen(false)}>
          <DropdownMenuLabel>
            作品菜单
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled={isLoading} onClick={refreshWork} className="cursor-pointer">
              数据更新
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpenAlert(p => !p)} className="cursor-pointer">
              删除收藏
            </DropdownMenuItem>
            <SubtitlesSubMenu id={work.id} existSubtitles={work.subtitles} onClose={() => setOpen(false)} />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>作品详情</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    售价：{work.price}
                    <sup className="font-bold">(JPY)</sup>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    评分：{work.rate}
                    <sup className="font-bold">({work.rateCount})</sup>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    销量：{work.sales}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    收藏数：{work.wishlistCount}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    赏析数：{work.reviewCount}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    发售日期：{work.releaseDate}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    收藏日期：{work.createdAt.slice(0, 10)}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    更新日期：{work.updatedAt.slice(0, 10)}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>语言版本</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {work.languageEditions.length === 0 && <DropdownMenuItem>没有其它版本</DropdownMenuItem>}
                  {work.languageEditions.map(languageEdition => (
                    <DropdownMenuItem asChild key={languageEdition.workId}>
                      <a href={`https://www.dlsite.com/maniax/work/=/product_id/${languageEdition.workId}.html`} target="_blank">
                        {languageEdition.label}
                        <svg aria-hidden="true" fill="none" focusable="false" height="1em" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="1em" className="flex text-current self-center"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></svg>
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {[
              { label: 'DLsite', link: `https://www.dlsite.com/maniax/work/=/product_id/${work.id}.html` },
              { label: 'One', link: `https://asmr.one/work/${work.id}` },
              { label: 'Kikoeru', link: `${settingOptions.kikoeru}/${work.id}` }
            ]
              .map(({ label, link }) => (
                <DropdownMenuItem asChild key={label}>
                  <a href={link} target="_blank">
                    {label}
                    <svg aria-hidden="true" fill="none" focusable="false" height="1em" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="1em" className="flex text-current self-center"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></svg>
                  </a>
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <WorkDeleteAlertDialog workId={work.id} open={openAlert} setOpen={setOpenAlert} />
    </>
  );
}

function WorkDeleteAlertDialog({ workId, open, setOpen }: { workId: string, open: boolean, setOpen: (open: boolean) => void }) {
  const [isLoading, toastcher] = useToastFetch();

  const handleClick = () => {
    toastcher<Work>(`/api/work/delete/${workId}`, { method: 'DELETE' }, {
      loading: `${workId} 删除中...`,
      success: `${workId} 删除成功`,
      error: `${workId} 删除失败`,
      finally() {
        setOpen(false);
        mutate(key => typeof key === 'string' && key.startsWith('/api/works'));
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-80">
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除收藏吗?</AlertDialogTitle>
          <AlertDialogDescription>
            认真考虑哦
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleClick} disabled={isLoading}>
            确定
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SubtitlesSubMenu({ id, existSubtitles, onClose }: { id: string, existSubtitles: boolean, onClose: () => void }) {
  const [isLoading, toastcher] = useToastFetch();

  const [open, setOpen] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const uploadSubtitles = (subtitles?: FileList | null, confirm = false) => {
    if (!subtitles || subtitles.length === 0) {
      toast.error('请选择字幕文件');
      return;
    }
    const formdata = new FormData();

    const file = subtitles[0];

    const fileExt = extractFileExt(file.name);
    const fileSize = file.size;

    if (!['zip', '7z', 'rar'].includes(fileExt) || fileSize > 1024 * 1024) {
      toast.error(
        <div>
          <p>文件格式仅支持 <code>7z zip rar</code></p>
          <p>并且大小不超过 <code>1MB</code></p>
        </div>
      );
      return;
    }

    formdata.append('subtitles', file);

    if (existSubtitles && !confirm) {
      setOpen(true);
      return;
    }

    toastcher(
      `/api/work/upload/subtitles/${id}`,
      {
        method: 'PUT',
        body: formdata
      },
      {
        loading: `${id} 字幕上传中...`,
        success: `${id} 字幕上传成功`,
        error: `${id} 字幕上传失败`,
        description: `上传的字幕名称为: ${file.name}`
      }
    );

    // 选择文件后关闭菜单
    onClose();
  };

  const handleDownload = () => {
    toastcher(`/api/work/subtitles/${id}`, {}, {
      success() {
        window.open(`/api/work/subtitles/${id}`);
        return `${id} 字幕下载成功`;
      },
      error: `${id} 字幕下载失败`
    });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>字幕</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={e => e.preventDefault()} disabled={isLoading}>
            <input
              ref={inputFileRef}
              type="file"
              id="subtitles-file-upload"
              className="hidden"
              onChange={e => uploadSubtitles(e.target.files)}
            />
            <Label htmlFor="subtitles-file-upload" className="leading-5 cursor-pointer w-full">
              上传字幕
            </Label>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload} disabled={isLoading} className="cursor-pointer">
            下载字幕
          </DropdownMenuItem>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="w-80">
              <AlertDialogHeader>
                <AlertDialogTitle>确定要覆盖原有字幕吗?</AlertDialogTitle>
                <AlertDialogDescription>
                  覆盖后不可恢复
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => uploadSubtitles(inputFileRef.current?.files, true)}
                  disabled={isLoading}
                >
                  确定
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
