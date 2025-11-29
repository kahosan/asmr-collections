export type Base = '/api';
export type WorkAPI =
  | 'work/create/:id'
  | 'work/update/:id'
  | 'work/delete/:id'
  | 'work/info/:id'
  | 'work/:id'
  | 'work/upload/subtitles/:id'
  | 'work/subtitles/:id'
  | 'work/similar/:id'
  | 'work/batch/create' | 'work/batch/update';

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
