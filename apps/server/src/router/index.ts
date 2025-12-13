import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { workApp } from './route/work';
import { fieldApp } from './route/field';
import { worksApp } from './route/works';
import { genresApp } from './route/genres';
import { tracksApp } from './route/tracks';
import { libraryApp } from './route/library';
import { storageApp } from './route/storage';

export const api = new Hono()
  .use(cors())
  .route('/work', workApp)
  .route('/works', worksApp)
  .route('/field', fieldApp)
  .route('/genres', genresApp)
  .route('/tracks', tracksApp)
  .route('/library', libraryApp)
  .route('/storage', storageApp);
