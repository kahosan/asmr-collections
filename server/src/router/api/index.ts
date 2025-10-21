import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fieldApp } from '~/handler/field';
import { libraryApp } from '~/handler/library';
import { tracksApp } from '~/handler/tracks';
import { workApp } from '~/handler/work';
import { worksApp } from '~/handler/works';

export const api = new Hono()
  .use(cors())
  .route('/work', workApp)
  .route('/works', worksApp)
  .route('/field', fieldApp)
  .route('/tracks', tracksApp)
  .route('/library', libraryApp);
