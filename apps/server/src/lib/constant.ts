import { join } from 'node:path';

export const IS_WORKERS = process.env.RUNTIME === 'workers';

export const REDIS_URL = process.env.REDIS_URL;

export const COVERS_PATH = join(process.cwd(), 'covers');

export const TRANSCODE_CACHE_PATH = join(process.cwd(), 'transcode_cache');

export const TRANSCODE_FORMATS = ['.wav', '.flac'];
