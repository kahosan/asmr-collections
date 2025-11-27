import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { workApp } from './route/work';
import { fieldApp } from './route/field';
import { worksApp } from './route/works';
import { tracksApp } from './route/tracks';
import { libraryApp } from './route/library';

export const api = new Hono()
  .use(cors())
  .route('/work', workApp)
  .route('/works', worksApp)
  .route('/field', fieldApp)
  .route('/tracks', tracksApp)
  .route('/library', libraryApp);
