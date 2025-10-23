import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';

import { FileImage, FileText, FolderClosed } from 'lucide-react';

import IconLink from '~/components/icon-link';
import FolderBreadcrumb from '../../components/breadcrumb/folder-breadcrumb';

import Details from './details';
import VideoItem from './video-item';
import AudioItem from './audio-item';

import useSWRImmutable from 'swr/immutable';
import { useParams, useSearch } from '@tanstack/react-router';

import { useAtom, useAtomValue } from 'jotai';
import { useMemo, useRef } from 'react';

import { match } from 'ts-pattern';

import { mediaAtom } from '~/hooks/use-media-state';

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
import { extractFileExt, collectSubtitles } from '~/lib/utils';
import { SubtitleMatcher } from '../../lib/subtitle-matcher';

import type { MediaTrack } from '~/hooks/use-media-state';
import { settingOptionsAtom } from '~/hooks/use-setting-options';

import type { Work } from '~/types/work';
import type { Tracks } from '~/types/tracks';

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
    const allSubtitles = collectSubtitles(data, true);

    return new SubtitleMatcher([currentDirSubtitles, allSubtitles]);
  }, [data, groupByType?.media]);

  const handlePlay = (track: MediaTrack, tracks?: MediaTrack[]) => {
    setMediaState(state => ({
      ...state,
      work: workData,
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
            {
              groupByType?.folder?.map(item => (
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
              ))
            }

            {
              groupByType?.media?.map(item => {
                const isCurrentTrack = mediaState.currentTrack?.title === item.title;
                const isText = item.type === 'text';
                const isVideo = extractFileExt(item.title) === 'mp4';
                const tracks = groupByType.media?.filter(track => track.type === 'audio');

                const textUrl = item.mediaStreamUrl;

                return (
                  <TableRow
                    key={item.title}
                    className={isCurrentTrack ? 'dark:bg-zinc-800 bg-slate-100' : ''}
                  >
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
                                existCurrentTrack={!!mediaState.currentTrack}
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

            {
              groupByType?.other?.map(item => (
                <TableRow key={item.title}>
                  <TableCell className="p-0">
                    <IconLink
                      to={item.mediaDownloadUrl}
                      target="_blank"
                      title={item.title}
                      icon={<FileText className="min-w-6" color="#9E9E9E" />}
                    >
                      {item.title}
                    </IconLink>
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
