export type Base = '/api';
export type WorkAPI =
  | 'work/create/:id'
  | 'work/refresh/:id'
  | 'work/delete/:id'
  | 'work/info/:id'
  | 'work/:id'
  | 'work/upload/subtitles/:id'
  | 'work/subtitles/:id';

export type WorksAPI = 'works';
export type FieldAPI = 'field/:field';
export type TracksAPI = 'tracks/:id';
export type LibraryAPI = 'library/sync';

export type FetcherKey =
  | `${Base}/${WorkAPI}`
  | `${Base}/${WorksAPI}`
  | `${Base}/${FieldAPI}`
  | `${Base}/${TracksAPI}`
  | `${Base}/${LibraryAPI}`
  | (string & {});
