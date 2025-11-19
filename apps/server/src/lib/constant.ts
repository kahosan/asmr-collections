import { join } from 'node:path';

export const VOICE_LIBRARY = process.env.VOICE_LIBRARY_PATH;

export const HOST_URL = process.env.HOST_URL;

export const IS_WORKERS = process.env.RUNTIME === 'workers';

export const REDIS_URL = process.env.REDIS_URL;

export const COVERS_PATH = join(process.cwd(), 'covers');
