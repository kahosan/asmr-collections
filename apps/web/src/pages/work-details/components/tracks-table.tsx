import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';

import { FileImage, FileText } from 'lucide-react';

import { Link } from '~/components/link';
import { FolderBreadcrumb } from '~/components/breadcrumb/folder-breadcrumb';

import { VideoItem } from './video-item';
import { AudioItem } from './audio-item';
import { FolderItem } from './folder-item';
import { PlaybackButton } from './playback-button';

import { useAtom } from 'jotai';
import { produce } from 'immer';
import { useMemo, useRef } from 'react';

import { match } from 'ts-pattern';

import { mediaStateAtom } from '~/hooks/use-media-state';
import { usePlayback, prepareTracks } from '~/hooks/use-playback';

import LightGallery from 'lightgallery/react';
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery';

import { extname, SubtitleMatcher, collectSubtitles } from '@asmr-collections/shared';

import lgZoom from 'lightgallery/plugins/zoom';
import lgRotate from 'lightgallery/plugins/rotate';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-rotate.css';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';

import type { Playback, Work, Tracks, SubtitleInfo, Track } from '@asmr-collections/shared';

const mediaTypeOrder: Record<string, number> = {
  audio: 0,
  text: 1
};

function compareTracks(a: Track, b: Track) {
  const aBase = a.title.slice(0, -extname(a.title).length);
  const bBase = b.title.slice(0, -extname(b.title).length);

  const baseCompare = aBase.localeCompare(bBase, undefined, {
    numeric: true,
    sensitivity: 'base'
  });

  if (baseCompare !== 0)
    return baseCompare;

  return (
    (mediaTypeOrder[a.type] ?? 99)
    - (mediaTypeOrder[b.type] ?? 99)
  );
}

interface TracksTableProps {
  work: Work
  tracks?: Tracks | null
  searchPath?: string[]
  externalSubtitles?: SubtitleInfo[]
  playback: Playback | null
}

export function TracksTabale({ work, tracks, searchPath, externalSubtitles, playback }: TracksTableProps) {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);

  const { trigger: updatePlayback } = usePlayback();

  const filterData = useMemo(() => {
    if (!searchPath) return tracks;

    return searchPath.reduce((acc, path) => {
      return acc?.find(item => item.title === path)?.children ?? [];
    }, tracks);
  }, [searchPath, tracks]);

  const groupByType = useMemo(() => {
    if (filterData) {
      const r = Object.groupBy(
        filterData,
        item => match(item.type)
          .when(type => type === 'audio' || type === 'text', () => 'media')
          .with('folder', () => 'folder')
          .with('image', () => 'image')
          .otherwise(() => 'other')
      );

      r.media?.sort(compareTracks);
      return r;
    }
  }, [filterData]);

  const allSubtitles = useMemo(() => {
    const all = collectSubtitles(tracks, true);
    return all.concat(externalSubtitles ?? []);
  }, [externalSubtitles, tracks]);

  const subtitleMatcher = useMemo(() => {
    const currentDirSubtitles = collectSubtitles(groupByType?.media);

    return new SubtitleMatcher([currentDirSubtitles, allSubtitles]);
  }, [groupByType?.media, allSubtitles]);

  const filterTracks = useMemo(
    () => groupByType?.media?.filter(track => track.type === 'audio'),
    [groupByType?.media]
  );

  const handlePlay = (track: Track, externalData?: { tracks: Tracks, position: number }) => {
    const currentSubtitle = subtitleMatcher.find(track.title);

    const currentTrack = {
      ...track,
      subtitles: currentSubtitle,
      position: externalData?.position
    };

    const tracks = externalData?.tracks ?? filterTracks?.map(item => {
      const subtitles = subtitleMatcher.find(item.title);
      return {
        ...item,
        subtitles
      };
    });

    if (work.favorited) {
      // 仅第一次播放时增加播放次数
      const incrementCount = mediaState.work?.id !== work.id;
      updatePlayback({
        id: work.id,
        track: prepareTracks(currentTrack),
        tracks: prepareTracks(tracks), incrementCount
      });
    }

    setMediaState(state => {
      if (state.work?.id !== work.id)
        return { work, open: true, allSubtitles, tracks, currentTrack };

      return produce(state, draft => {
        draft.currentTrack = currentTrack;
        draft.tracks = tracks;
      });
    });
  };

  const enqueueTrack = (track: Track) => {
    if (mediaState.tracks?.some(item => item.title === track.title)) return;

    const subtitles = subtitleMatcher.find(track.title);
    setMediaState(state => produce(state, draft => {
      draft.tracks?.push({
        ...track,
        subtitles
      });
    }));
  };

  // 添加目录中的音频至播放列表
  const enqueueTracks = (target: Tracks | undefined) => {
    if (!target) return;

    const newTracks = target.reduce<Tracks>((acc, item) => {
      if (item.type === 'audio' && !mediaState.tracks?.some(track => track.title === item.title)) {
        const subtitles = subtitleMatcher.find(item.title);
        acc.push({ ...item, subtitles });
      }
      return acc;
    }, []);

    if (newTracks.length === 0) return;

    setMediaState(state => produce(state, draft => {
      draft.tracks?.push(...newTracks);
    }));
  };

  const lightGalleryRef = useRef<LightGalleryType>(null);

  const openGallery = (index: number) => {
    if (lightGalleryRef.current)
      lightGalleryRef.current.openGallery(index);
  };

  return (
    <>
      <PlaybackButton
        id={work.id}
        currentPlayWorkId={mediaState.work?.id}
        handlePlayback={handlePlay}
        playback={playback}
      />

      <FolderBreadcrumb path={searchPath} />

      {
        (groupByType?.image && groupByType.image.length > 0) && (
          <div style={{ display: 'none' }}>
            <LightGallery
              onInit={detail => {
                lightGalleryRef.current = detail.instance;
              }}
              licenseKey="free"
              speed={400}
              preload={4}
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

      <div className="mt-4 border rounded-md overflow-hidden">
        <Table className="table-fixed">
          <TableBody>
            {
              groupByType?.folder?.map(item => {
                const disabled =
                  item.children?.filter(child => child.type === 'audio').length === 0 || !mediaState.currentTrack;
                return (
                  <TableRow key={item.title}>
                    <TableCell className="p-0 whitespace-normal h-12.5">
                      <FolderItem searchPath={searchPath} track={item} enqueueTracks={enqueueTracks} disabled={disabled} />
                    </TableCell>
                  </TableRow>
                );
              })
            }

            {
              groupByType?.media?.map(item => {
                const isActive = mediaState.currentTrack?.hash === item.hash;
                const videoFt = ['mp4', 'mkv', 'avi', 'mov'];
                const isVideo = videoFt.includes(extname(item.title).toLowerCase());

                const textUrl = item.mediaStreamUrl;

                const mediaType = item.type === 'text' ? 'text' : (isVideo ? 'video' : 'audio');

                const disableEnqueue = !mediaState.currentTrack || !!mediaState.tracks
                  ?.find(track => track.hash === item.hash);

                return (
                  <TableRow
                    key={item.title}
                    className={isActive ? 'dark:bg-neutral-800! bg-slate-200/80!' : ''}
                  >
                    <TableCell className="p-0 whitespace-normal h-12.5">
                      {
                        match(mediaType)
                          .with('text', () => (
                            <Link
                              to={textUrl}
                              target="_blank"
                              title={item.title}
                              className="flex items-center py-1"
                            >
                              <FileText className="min-size-8 mx-4" color="#7CB920" />
                              <p className="line-clamp-2">{item.title}</p>
                            </Link>
                          ))
                          .with('video', () => (
                            <VideoItem
                              track={item}
                              tracks={filterTracks}
                              work={work}
                            />
                          ))
                          .with('audio', () => (
                            <AudioItem
                              track={item}
                              onPlay={() => handlePlay(item)}
                              enqueueTrack={() => enqueueTrack(item)}
                              disableEnqueue={disableEnqueue}
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
                  <TableCell className="p-0 whitespace-normal h-12.5">
                    <button
                      type="button"
                      onClick={() => openGallery(index)}
                      className="w-full flex items-center py-1 text-start"
                    >
                      <FileImage className="min-size-8 mx-4" color="#FF9800" />
                      <p className="line-clamp-2">{item.title}</p>
                    </button>
                  </TableCell>
                </TableRow>
              ))
            }

            {
              groupByType?.other?.map(item => {
                const url = item.mediaDownloadUrl;
                return (
                  <TableRow key={item.title}>
                    <TableCell className="p-0 whitespace-normal h-12.5">
                      <Link
                        to={url}
                        target="_blank"
                        title={item.title}
                        className="flex items-center py-1"
                      >
                        <FileText className="min-size-8 mx-4" color="#9E9E9E" />
                        <p className="line-clamp-2">{item.title}</p>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </div>
    </>
  );
}
