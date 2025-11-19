import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fieldApp } from '../route/field';
import { libraryApp } from '../route/library';
import { tracksApp } from '../route/tracks';
import { workApp } from '../route/work';
import { worksApp } from '../route/works';

export const api = new Hono()
  .use(cors())
  .route('/work', workApp)
  .route('/works', worksApp)
  .route('/field', fieldApp)
  .route('/tracks', tracksApp)
  .route('/library', libraryApp);
