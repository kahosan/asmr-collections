import { Button } from '~/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from '~/components/ui/context-menu';

import Details from './details';

import useSWRImmutable from 'swr/immutable';
import { useParams, useSearch } from '@tanstack/react-router';

import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo, useRef, useState } from 'react';
import { mediaAtom } from '~/hooks/use-media-state';

import FolderBreadcrumb from './folder-breadcrumb';

import LightGallery from 'lightgallery/react';
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery';

import lgZoom from 'lightgallery/plugins/zoom';
import lgRotate from 'lightgallery/plugins/rotate';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-rotate.css';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';

import { fetcher } from '~/lib/fetcher';
import { extractFileExt } from '~/lib/utils';

import type { MediaTrack } from '~/hooks/use-media-state';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import type { Work } from '~/types/work';
import type { Track, Tracks } from '~/types/tracks';
import { FileImage, FileMusic, FileText, FileVideo, FolderClosed } from 'lucide-react';
import IconLink from '~/components/icon-link';

function getFileName(title: string) {
  return title.slice(0, Math.max(0, title.lastIndexOf('.'))) || title;
}

export default function WorkDetails() {
  const { id } = useParams({ from: '/work-details/$id' });
  const search = useSearch({ from: '/work-details/$id' });

  const settings = useAtomValue(settingOptionsAtom);

  const [mediaState, setMediaState] = useAtom(mediaAtom);

  const api = settings.useLocalVoiceLibrary
    ? `/api/tracks/${id}`
    : `/proxy/${encodeURIComponent(`https://api.asmr-200.com/api/tracks/${id.replace('RJ', '')}`)}`;

  const { data } = useSWRImmutable<Tracks>(
    api,
    fetcher,
    { suspense: true }
  );

  const { data: workData } = useSWRImmutable<Work>(
    `/api/work/${id}`,
    fetcher,
    { suspense: true }
  );

  const filterData = search.path?.reduce((acc, path) => {
    return acc?.find(item => item.title === path)?.children ?? [];
  }, data) ?? data;

  const groupByType = useMemo(() => {
    if (filterData) return Object.groupBy(filterData, item => ((item.type === 'audio' || item.type === 'text') ? 'media' : item.type));
  }, [filterData]);

  const subtitles = groupByType?.media?.filter(item => ['srt', 'lrc', 'vtt'].includes(extractFileExt(item.title) ?? ''));

  const subtitleMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    if (!subtitles) return map;

    subtitles.forEach(subtitle => {
      const name = getFileName(subtitle.title);
      map.set(name, subtitle.mediaDownloadUrl);
    });

    return map;
  }, [subtitles]);

  const handlePlay = (track: MediaTrack, tracks?: MediaTrack[]) => {
    setMediaState(state => ({
      ...state,
      work: workData,
      open: true,
      tracks: tracks?.map(item => ({
        ...item,
        subtitles: {
          src: subtitleMap.get(getFileName(item.title))
        }
      })),
      currentTrack: {
        ...track,
        subtitles: {
          src: subtitleMap.get(getFileName(track.title))
        }
      }
    }));
  };

  const enqueueTrack = (track: MediaTrack) => {
    if (mediaState.tracks?.find(item => item.title === track.title)) return;
    setMediaState(state => ({
      ...state,
      tracks: [
        ...(state.tracks ?? []),
        {
          ...track,
          subtitles: {
            src: subtitleMap.get(getFileName(track.title))
          }
        }
      ]
    }));
  };

  const lightGalleryRef = useRef<LightGalleryType>(null);

  const openGallery = (index: number) => {
    if (lightGalleryRef.current)
      lightGalleryRef.current.openGallery(index);
  };

  return (
    <>
      {(workData && settings.showWorkDetail) && <Details work={workData} />}
      {search.path?.length !== 0 && <FolderBreadcrumb path={search.path} id={id} />}
      {
        (groupByType?.image && groupByType.image.length > 0) && (
          <div style={{ display: 'none' }}>
            <LightGallery
              onInit={detail => {
                lightGalleryRef.current = detail.instance;
              }}
              speed={200}
              plugins={[lgThumbnail, lgZoom, lgRotate]}
              download
              counter
              dynamic
              dynamicEl={groupByType.image.map(item => ({
                src: item.mediaDownloadUrl,
                alt: item.title,
                thumb: item.mediaDownloadUrl,
                subHtml: `<h4>${item.title}</h4>`
              }))}
            />
          </div>
        )
      }
      <div className="mt-4 border rounded-md">
        <Table className="table-fixed">
          <TableBody>
            {groupByType?.folder?.map(item => (
              <TableRow key={item.title}>
                <TableCell className="p-0">
                  <IconLink
                    to="/work-details/$id"
                    params={{ id }}
                    search={{ path: (search.path ?? []).concat(item.title) }}
                    icon={<FolderClosed className="min-w-6" color="#56CBFC" />}
                  >
                    {item.title}
                  </IconLink>
                </TableCell>
              </TableRow>
            ))}
            {
              groupByType?.media?.map(item => {
                const isCurrentTrack = mediaState.currentTrack?.title === item.title;
                const isText = item.type === 'text';
                const isVideo = extractFileExt(item.title) === 'mp4';

                const textUrl = item.mediaStreamUrl;

                const tracks = groupByType.media?.filter(track => track.type === 'audio');

                return (
                  <TableRow key={item.title} className={isCurrentTrack ? 'dark:bg-zinc-800 bg-slate-100' : ''}>
                    <TableCell className="p-0">
                      {
                        isText
                          ? (
                            <IconLink
                              to={textUrl}
                              target="_blank"
                              title={item.title}
                              icon={<FileText className="min-w-6" color="#7CB920" />}
                            >
                              {item.title}
                            </IconLink>
                          )
                          : (isVideo
                            ? (
                              <VideoItem
                                track={item}
                                tracks={tracks}
                                work={workData}
                              />
                            )
                            : (
                              <AudioItem
                                existCurrentTrack={!mediaState.currentTrack}
                                track={item}
                                onPlay={() => handlePlay(item, tracks)}
                                enqueueTrack={() => enqueueTrack(item)}
                              />
                            ))
                      }
                    </TableCell>
                  </TableRow>
                );
              })
            }
            {
              groupByType?.image?.map((item, index) => (
                <TableRow key={item.title}>
                  <TableCell className="p-0">
                    <button
                      type="button"
                      onClick={() => openGallery(index)}
                      className="w-full flex gap-3 items-center p-3"
                    >
                      <FileImage className="min-w-6" color="#FF9800" />
                      <p className="truncate">{item.title}</p>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function VideoItem({ track, tracks, work }: { track: Track, tracks?: Tracks, work?: Work }) {
  const [currentTrack, setCurrentTrack] = useState(() => track);

  const changeTrack = useCallback((next = false) => {
    const currentIndex = tracks?.findIndex(track => track.title === currentTrack.title);

    if (!currentIndex && currentIndex !== 0) return;

    const nextIndex = next ? currentIndex + 1 : currentIndex - 1;
    const nextTrack = tracks?.at(nextIndex);

    if (nextTrack) setCurrentTrack(nextTrack);
  }, [currentTrack.title, tracks]);

  const onPlaying = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: work?.artists.map(artist => artist.name).join(', '),
        album: work?.name,
        artwork: [
          { src: work?.cover ?? '' }
        ]
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => changeTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => changeTrack(true));
    }
  }, [changeTrack, currentTrack.title, work?.artists, work?.cover, work?.name]);

  return (
    <Dialog>
      <DialogTrigger className="flex gap-3 items-center p-3 w-full" title={track.title}>
        <FileVideo className="min-w-6" color="#4B60D7" />
        <p className="truncate">{track.title}</p>
      </DialogTrigger>
      <DialogContent className="p-2" onInteractOutside={e => e.preventDefault()}>
        <DialogTitle className="text-md truncate w-[60%]" title={currentTrack.title}>
          {currentTrack.title}
        </DialogTitle>
        <video
          controls
          src={currentTrack.mediaDownloadUrl}
          className="rounded-sm"
          onPlaying={onPlaying}
        />
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => changeTrack()}>上一个</Button>
          <Button variant="outline" onClick={() => changeTrack(true)}>下一个</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AudioItem({ existCurrentTrack, track, onPlay, enqueueTrack }: { existCurrentTrack?: boolean, track: MediaTrack, onPlay: () => void, enqueueTrack: (track: MediaTrack) => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex gap-3 items-center p-3 w-full cursor-pointer" onClick={onPlay} title={track.title}>
        <FileMusic className="min-w-6" color="#4083e7" />
        <p className="truncate">{track.title}</p>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>操作</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onPlay}>播放</ContextMenuItem>
        <ContextMenuItem disabled={existCurrentTrack} onClick={() => enqueueTrack(track)}>添加到播放列表</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
