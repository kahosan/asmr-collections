export type Base = '/api';
export type WorkAPI =
  | 'work/create/:id'
  | 'work/refresh/:id'
  | 'work/delete/:id'
  | 'work/info/:id'
  | 'work/:id'
  | 'work/upload/subtitles/:id'
  | 'work/subtitles/:id'
  | 'work/exists/:id'
  | 'work/similar/:id'
  | 'work/batch/create' | 'work/batch/refresh';

export type WorksAPI = 'works';
export type FieldAPI = 'field/:field';
export type TracksAPI =
  | 'tracks/:id'
  | 'tracks/:id/cache/clear';
export type LibraryAPI =
  | 'library/exists/:id';

export type FetcherKey =
  | `${Base}/${WorkAPI}`
  | `${Base}/${WorksAPI}`
  | `${Base}/${FieldAPI}`
  | `${Base}/${TracksAPI}`
  | `${Base}/${LibraryAPI}`
  | (string & {});
