import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { confirm } from '../ui/confirmer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu';

import { Link } from '../link';

import { MenuIcon } from 'lucide-react';

import { extname } from '@asmr-collections/shared';

import { toast } from 'sonner';
import { memo, useState } from 'react';

import { useToastMutation } from '~/hooks/use-toast-fetch';

import { externalUrl } from '~/utils';
import { mutateWorkInfo, mutateWorks } from '~/lib/mutation';

import type { Work } from '@asmr-collections/shared';

interface Props {
  work: Work
}

export const Menu = memo(({ work }: Props) => {
  const [open, setOpen] = useState(false);

  const [updateAction, updateIsMutating] = useToastMutation('update');

  const handleUpdate = () => {
    updateAction({
      key: `/api/work/update/${work.id}`,
      fetchOps: { method: 'PUT' },
      toastOps: {
        loading: `${work.id} 数据更新中...`,
        success: `${work.id} 数据更新成功`,
        error: `${work.id} 数据更新失败`,
        finally() {
          setOpen(false);
          mutateWorks();
        }
      }
    });
  };

  const [deleteAction, deleteIsMutating] = useToastMutation('delete');

  const handleDelete = async () => {
    const yes = await confirm({
      title: '确定要删除收藏吗?',
      description: '认真考虑哦'
    });
    if (!yes) return;

    deleteAction({
      key: `/api/work/delete/${work.id}`,
      fetchOps: { method: 'DELETE' },
      toastOps: {
        loading: `${work.id} 删除中...`,
        success: `${work.id} 删除成功`,
        error: `${work.id} 删除失败`,
        finally() {
          setOpen(false);
          mutateWorks();
        }
      }
    });
  };

  return (
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
      <DropdownMenuContent className="w-56 max-[400px]:w-40" onInteractOutside={() => setOpen(false)}>
        <DropdownMenuLabel>
          作品菜单
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={updateIsMutating} onClick={handleUpdate}>
            数据更新
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteIsMutating}
          >
            删除收藏
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SubtitlesSubMenu id={work.id} existsSubtitles={work.subtitles} onClose={() => setOpen(false)} />
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
                  发售日期：{work.releaseDate.slice(0, 10)}
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
                    <Link to={externalUrl.dlsite(languageEdition.workId)} isExternal showAnchorIcon>
                      {languageEdition.label}
                    </Link>
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
            { label: 'One', link: `https://asmr.one/work/${work.id}` }
          ]
            .map(({ label, link }) => (
              <DropdownMenuItem asChild key={label}>
                <Link to={link} isExternal showAnchorIcon>
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export function SubtitlesSubMenu({ id, existsSubtitles, onClose }: { id: string, existsSubtitles: boolean, onClose?: () => void }) {
  const [subtitlesAction, subtitlesIsMutating] = useToastMutation('subtitles');

  const uploadSubtitles = async (subtitles?: FileList | null) => {
    if (!subtitles || subtitles.length === 0) {
      toast.error('请选择字幕文件');
      return;
    }
    const formdata = new FormData();

    const file = subtitles[0];

    const fileExt = extname(file.name);
    const fileSize = file.size;

    if (!['zip'].includes(fileExt) || fileSize > 2 * 1024 * 1024) {
      toast.error(
        <div>
          <p>文件格式仅支持 <code>zip</code></p>
          <p>并且大小不超过 <code>2MB</code></p>
        </div>
      );
      return;
    }

    formdata.append('subtitles', file);

    if (existsSubtitles) {
      const yes = await confirm({
        title: '可能已存在字幕，确定要覆盖吗?',
        description: '覆盖后不可恢复'
      });
      if (!yes) return;
    }

    subtitlesAction({
      key: `/api/work/upload/subtitles/${id}`,
      fetchOps: {
        method: 'PUT',
        body: formdata
      },
      toastOps: {
        loading: `${id} 字幕上传中...`,
        success() {
          // 重新请求字幕信息
          mutateWorkInfo(id);
          return `${id} 字幕上传成功`;
        },
        error: `${id} 字幕上传失败`,
        description: `上传的字幕名称为: ${file.name}`
      }
    });

    onClose?.();
  };

  const handleDownload = () => {
    subtitlesAction({
      key: `/api/work/subtitles/${id}`,
      toastOps: {
        success() {
          window.open(`/api/work/subtitles/${id}`);
          return `${id} 字幕下载成功`;
        },
        error: `${id} 字幕下载失败`
      }
    });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>字幕</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={e => e.preventDefault()} disabled={subtitlesIsMutating}>
            <input
              type="file"
              id="subtitles-file-upload"
              className="hidden"
              onChange={e => uploadSubtitles(e.target.files)}
            />
            <Label htmlFor="subtitles-file-upload" className="leading-5 w-full">
              上传字幕
            </Label>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload} disabled={subtitlesIsMutating}>
            下载字幕
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
