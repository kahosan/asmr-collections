import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';

import { FileImage, FileText, FolderClosed } from 'lucide-react';

import { Link } from '@tanstack/react-router';

import FolderBreadcrumb from '../../components/breadcrumb/folder-breadcrumb';

import VideoItem from './video-item';
import AudioItem from './audio-item';

import { useAtom } from 'jotai';
import { Activity, useEffect, useMemo, useRef } from 'react';

import { match } from 'ts-pattern';

import useSWRImmutable from 'swr/immutable';
import { mediaAtom } from '~/hooks/use-media-state';

import { toast } from 'sonner';

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
import { SubtitleMatcher } from '../../lib/subtitle-matcher';
import { extractFileExt, collectSubtitles, notifyError } from '~/lib/utils';

import type { MediaTrack } from '~/hooks/use-media-state';
import type { SettingOptions } from '~/hooks/use-setting-options';

import type { Tracks } from '~/types/tracks';
import type { Work } from '~/types/work';

interface TracksTableProps {
  work: Work
  search: { path?: string[] }
  settings: SettingOptions
}

export default function TracksTabale({ work, search, settings }: TracksTableProps) {
  const [mediaState, setMediaState] = useAtom(mediaAtom);

  const { data: isExists } = useSWRImmutable<{ exists: boolean }>(
    settings.useLocalVoiceLibrary ? `/api/library/exists/${work.id}` : null,
    fetcher,
    {
      onError: e => notifyError(e, '获取作品是否存在于本地库中失败'),
      suspense: true
    }
  );

  const asmrOneApi = `/proxy/${encodeURIComponent(`${settings.asmrOneApi}/api/tracks/${work.id.replace('RJ', '')}`)}`;
  const localApi = `/api/tracks/${work.id}`;

  const tracksApi = match(settings.useLocalVoiceLibrary)
    .when(v => v && isExists?.exists, () => localApi)
    .when(v => v && isExists?.exists === false, () => {
      return settings.fallbackToAsmrOneApi ? asmrOneApi : null;
    })
    .with(false, () => asmrOneApi)
    .otherwise(() => null);

  const errorText = tracksApi === localApi
    ? '获取本地数据失败'
    : '获取 ASMR.ONE 数据失败';

  const { data: tracks } = useSWRImmutable<Tracks>(
    tracksApi,
    fetcher,
    {
      onError: e => notifyError(e, errorText),
      suspense: true
    }
  );

  const filterData = search.path?.reduce((acc, path) => {
    return acc?.find(item => item.title === path)?.children ?? [];
  }, tracks) ?? tracks;

  const groupByType = useMemo(() => {
    if (filterData) {
      return Object.groupBy(
        filterData,
        item => match(item.type)
          .when(type => type === 'audio' || type === 'text', () => 'media')
          .with('folder', () => 'folder')
          .with('image', () => 'image')
          .otherwise(() => 'other')
      );
    }
  }, [filterData]);

  const subtitleMatcher = useMemo(() => {
    const currentDirSubtitles = collectSubtitles(groupByType?.media);
    const allSubtitles = collectSubtitles(tracks, true);

    return new SubtitleMatcher([currentDirSubtitles, allSubtitles]);
  }, [tracks, groupByType?.media]);

  const handlePlay = (track: MediaTrack, tracks?: MediaTrack[]) => {
    setMediaState(state => ({
      ...state,
      work,
      open: true,
      tracks: tracks?.map(item => ({
        ...item,
        subtitles: {
          src: subtitleMatcher.find(item.title)?.url
        }
      })),
      currentTrack: {
        ...track,
        subtitles: {
          src: subtitleMatcher.find(track.title)?.url
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
            src: subtitleMatcher.find(track.title)?.url
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

  useEffect(() => {
    if (tracksApi === asmrOneApi && settings.fallbackToAsmrOneApi) {
      toast.success(
        '成功回退至 ASMR.ONE 获取数据',
        { id: work.id }
      );
    }
  }, [asmrOneApi, settings.fallbackToAsmrOneApi, tracksApi, work.id]);

  if (!tracksApi) {
    return (
      <p className="mt-2 text-sm opacity-65">
        当前作品不在本地库中，且未启用回退 ASMR.ONE。
      </p>
    );
  }

  return (
    <>
      <Activity mode={tracks ? 'visible' : 'hidden'} name="tracks-table-breadcrumb">
        <FolderBreadcrumb path={search.path} id={work.id} />
      </Activity>

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
            {
              groupByType?.folder?.map(item => (
                <TableRow key={item.title}>
                  <TableCell className="p-0 whitespace-normal">
                    <Link
                      to="/work-details/$id"
                      params={{ id: work.id }}
                      search={{ path: (search.path ?? []).concat(item.title) }}
                      className="flex items-center gap-3 p-3"
                      resetScroll={false}
                    >
                      <FolderClosed className="min-size-7" color="#56CBFC" />
                      <p className="line-clamp-2">{item.title}</p>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            }

            {
              groupByType?.media?.map(item => {
                const isCurrentTrack = mediaState.currentTrack?.title === item.title;
                const videoFt = ['mp4', 'mkv', 'avi', 'mov'];
                const isVideo = videoFt.includes(extractFileExt(item.title).toLowerCase());
                const tracks = groupByType.media?.filter(track => track.type === 'audio');

                const textUrl = item.mediaStreamUrl;

                const mediaType = item.type === 'text' ? 'text' : (isVideo ? 'video' : 'audio');

                return (
                  <TableRow
                    key={item.title}
                    className={isCurrentTrack ? 'dark:bg-zinc-800 bg-slate-100' : ''}
                  >
                    <TableCell className="p-0 whitespace-normal">
                      {
                        match(mediaType)
                          .with('text', () => (
                            <Link
                              to={textUrl}
                              target="_blank"
                              title={item.title}
                              className="flex gap-3 items-center p-3"
                              resetScroll={false}
                            >
                              <FileText className="min-size-7" color="#7CB920" />
                              <p className="line-clamp-2">{item.title}</p>
                            </Link>
                          ))
                          .with('video', () => (
                            <VideoItem
                              track={item}
                              tracks={tracks}
                              work={work}
                            />
                          ))
                          .with('audio', () => (
                            <AudioItem
                              existCurrentTrack={!!mediaState.currentTrack}
                              track={item}
                              onPlay={() => handlePlay(item, tracks)}
                              enqueueTrack={() => enqueueTrack(item)}
                            />
                          ))
                          .exhaustive()
                      }
                    </TableCell>
                  </TableRow>
                );
              })
            }

            {
              groupByType?.image?.map((item, index) => (
                <TableRow key={item.title}>
                  <TableCell className="p-0 whitespace-normal">
                    <button
                      type="button"
                      onClick={() => openGallery(index)}
                      className="w-full flex gap-3 items-center p-3 text-start"
                    >
                      <FileImage className="min-size-7" color="#FF9800" />
                      <p className="line-clamp-2">{item.title}</p>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            }

            {
              groupByType?.other?.map(item => (
                <TableRow key={item.title}>
                  <TableCell className="p-0 whitespace-normal">
                    <Link
                      to={item.mediaDownloadUrl}
                      target="_blank"
                      title={item.title}
                      className="flex gap-3 items-center p-3"
                      resetScroll={false}
                    >
                      <FileText className="min-size-7" color="#9E9E9E" />
                      <p className="line-clamp-2">{item.title}</p>
                    </Link>
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
