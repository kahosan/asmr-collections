import { join } from 'node:path';
import { readdir, stat } from 'node:fs/promises';

import { throttle } from '@asmr-collections/shared';

import { TRANSCODE_CACHE_PATH } from './constant';

const bin = join(TRANSCODE_CACHE_PATH, 'ffmpeg');

let _hasFdkAAC: boolean | null = null;

function checkFdkSupport(): boolean {
  if (_hasFdkAAC !== null) return _hasFdkAAC;

  try {
    const proc = Bun.spawnSync({
      cmd: [bin, '-hide_banner', '-encoders'],
      stderr: 'ignore'
    });

    const output = proc.stdout.toString();
    _hasFdkAAC = output.includes('libfdk_aac');
  } catch (error) {
    console.error('检测支持 FDK-AAC 时出错', error);
    _hasFdkAAC = false;
  }

  return _hasFdkAAC;
}

const clearCache = throttle(async () => {
  try {
    const files = await readdir(TRANSCODE_CACHE_PATH)
      .then(names => names.filter(name => !name.endsWith('.tmp')));

    if (files.length >= 200) {
      const results = await Promise.allSettled(
        files.map(async name => {
          const path = join(TRANSCODE_CACHE_PATH, name);
          try {
            const s = await stat(path);
            return { name, path, time: s.mtimeMs };
          } catch {
            return null;
          }
        })
      );

      const fileStats = results.flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : []));

      const sortedFiles = fileStats.sort((a, b) => a.time - b.time);
      const filesToDelete = sortedFiles.slice(0, 10);

      await Promise.all(filesToDelete.map(f => Bun.file(f.path).delete()));
      console.log(`清理转码缓存文件夹，删除了 ${filesToDelete.length} 个文件`);
    }
  } catch (error) {
    console.error('清理转码缓存文件夹时出错', error);
  }
}, 10 * 60 * 1000);

export function createFFmpegProc(bitrate: number, input: string, output: string) {
  const useFdk = checkFdkSupport();

  clearCache();

  const cmd = [
    bin,
    '-y',
    '-hide_banner',
    '-loglevel', 'error',
    '-i', input,

    '-c:a', useFdk ? 'libfdk_aac' : 'aac',
    '-b:a', `${bitrate}k`,

    '-f', 'mp4',

    '-movflags', '+faststart',

    output
  ];

  return Bun.spawn({
    cmd,
    onExit(_proc, _exitCode, _signalCode, error) {
      if (error) console.error(error);
    }
  });
}
