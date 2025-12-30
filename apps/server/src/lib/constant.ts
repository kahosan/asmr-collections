import { join } from 'node:path';

const DATA_PATH = process.env.DATA_PATH || join(process.cwd(), 'data');

export const IS_WORKERS = process.env.RUNTIME === 'workers';

export const COVERS_PATH = join(DATA_PATH, 'covers');

export const TRANSCODE_CACHE_PATH = join(DATA_PATH, 'transcode_cache');

export const SQLITE_DB_PATH = join(DATA_PATH, 'cache.db');

export const TRANSCODE_FORMATS = ['.wav', '.flac'];
