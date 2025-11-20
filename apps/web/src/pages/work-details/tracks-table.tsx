import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';

import { FileImage, FileText, FolderClosed } from 'lucide-react';

import { Link } from '@tanstack/react-router';

import FolderBreadcrumb from '../../components/breadcrumb/folder-breadcrumb';

import VideoItem from './video-item';
import AudioItem from './audio-item';
import ContinueLastPlayback from './continue-last-playback';

import { useAtom } from 'jotai';
import { produce } from 'immer';
import { useMemo, useRef } from 'react';

import { match } from 'ts-pattern';

import { mediaStateAtom } from '~/hooks/use-media-state';

import LightGallery from 'lightgallery/react';
import type { LightGallery as LightGalleryType } from 'lightgallery/lightgallery';

import lgZoom from 'lightgallery/plugins/zoom';
import lgRotate from 'lightgallery/plugins/rotate';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-rotate.css';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';

import { SubtitleMatcher, collectSubtitles } from '../../lib/subtitle-matcher';

import { extractFileExt } from '~/utils';

import type { MediaTrack, SubtitleInfo } from '~/hooks/use-media-state';

import type { Tracks } from '~/types/tracks';
import type { Work } from '~/types/work';

interface TracksTableProps {
  work: Work
  tracks?: Tracks | null
  searchPath?: string[]
  externalSubtitles?: SubtitleInfo[]
}

export default function TracksTabale({ work, tracks, searchPath, externalSubtitles }: TracksTableProps) {
  const [mediaState, setMediaState] = useAtom(mediaStateAtom);

  const filterData = searchPath?.reduce((acc, path) => {
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

  const allSubtitles = useMemo(() => {
    const all = collectSubtitles(tracks, true);
    if (all.length > 0) return all;

    return externalSubtitles ?? [];
  }, [externalSubtitles, tracks]);

  const subtitleMatcher = useMemo(() => {
    const currentDirSubtitles = collectSubtitles(groupByType?.media);

    return new SubtitleMatcher([currentDirSubtitles, allSubtitles]);
  }, [groupByType?.media, allSubtitles]);

  const filterTracks = useMemo(
    () => groupByType?.media?.filter(track => track.type === 'audio'),
    [groupByType?.media]
  );

  const handlePlay = (track: MediaTrack) => {
    const currentSubtitle = subtitleMatcher.find(track.title);
    setMediaState({
      work,
      open: true,
      allSubtitles,
      tracks: filterTracks?.map(item => {
        const subtitles = subtitleMatcher.find(item.title);
        return {
          ...item,
          subtitles
        };
      }),
      currentTrack: {
        ...track,
        subtitles: currentSubtitle
      }
    });
  };

  const handlePlayHistory = (track: MediaTrack, lastPlayedAt?: number) => {
    const currentSubtitle = subtitleMatcher.find(track.title);
    setMediaState({
      work,
      open: true,
      allSubtitles,
      tracks: filterTracks?.map(item => {
        const subtitles = subtitleMatcher.find(item.title);
        return {
          ...item,
          subtitles
        };
      }),
      currentTrack: {
        ...track,
        subtitles: currentSubtitle,
        lastPlayedAt
      }
    });
  };

  const enqueueTrack = (track: MediaTrack) => {
    if (mediaState.tracks?.find(item => item.title === track.title)) return;

    const subtitles = subtitleMatcher.find(track.title);
    setMediaState(state => produce(state, draft => {
      draft.tracks?.push({
        ...track,
        subtitles
      });
    }));
  };

  const lightGalleryRef = useRef<LightGalleryType>(null);

  const openGallery = (index: number) => {
    if (lightGalleryRef.current)
      lightGalleryRef.current.openGallery(index);
  };

  return (
    <>
      <ContinueLastPlayback id={work.id} currentPlayWorkId={mediaState.work?.id} handlePlayHistory={handlePlayHistory} />

      <FolderBreadcrumb path={searchPath} />

      {
        (groupByType?.image && groupByType.image.length > 0) && (
          <div style={{ display: 'none' }}>
            <LightGallery
              onInit={detail => {
                lightGalleryRef.current = detail.instance;
              }}
              licenseKey="free"
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
                  <TableCell className="p-0 whitespace-normal h-12.5">
                    <Link
                      from="/work-details/$id"
                      search={{ path: (searchPath ?? []).concat(item.title) }}
                      className="flex items-center py-1"
                    >
                      <FolderClosed className="min-size-8 mx-4" color="#56CBFC" />
                      <div>
                        <p className="line-clamp-2">{item.title}</p>
                        <small className="opacity-70">{item.children?.length ?? 0} 项目</small>
                      </div>
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

                const textUrl = item.mediaStreamUrl;

                const mediaType = item.type === 'text' ? 'text' : (isVideo ? 'video' : 'audio');

                return (
                  <TableRow
                    key={item.title}
                    className={isCurrentTrack ? 'dark:bg-zinc-800 bg-slate-100' : ''}
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
                              existCurrentTrack={!!mediaState.currentTrack}
                              track={item}
                              onPlay={() => handlePlay(item)}
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
