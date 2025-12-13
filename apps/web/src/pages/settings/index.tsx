import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useImmerAtom, useSetImmerAtom } from 'jotai-immer';
import { createLazyRoute } from '@tanstack/react-router';

import { settingOptionsAtom } from '~/hooks/use-setting-options';
import { transcodeTempAtom } from '~/hooks/use-transcode-options';

import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';

import { StorageSettings } from './components/storage';
import { SettingItem } from './components/setting-item';
import { SettingInput } from './components/setting-input';
import { TranscodeSettings } from './components/transcode';
import { StorageSkeleton } from './components/storage-skeleton';
import { SmartPathSettings } from './components/smart-path-settings';

function Settings() {
  const [options, setOptions] = useImmerAtom(settingOptionsAtom);
  const setTranscodeTemp = useSetImmerAtom(transcodeTempAtom);

  const storage = options.storage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4.5 max-w-2xl mx-auto mt-4"
    >
      <SettingInput
        id="kikoeru"
        name="kikoeru"
        placeholder={options.kikoeru}
        value={options.kikoeru}
        onChange={e => setOptions(d => {
          d.kikoeru = e.target.value;
        })}
      >
        自建 Kikoeru 地址
      </SettingInput>

      <SettingInput
        id="asmr-one-api"
        name="asmr-one-api"
        placeholder={options.asmrOneApi}
        value={options.asmrOneApi}
        onChange={e => setOptions(d => {
          d.asmrOneApi = e.target.value;
        })}
      >
        ASMR.ONE API
      </SettingInput>

      <Separator />

      <SettingItem
        id="use-asmr-one-recommender"
        checked={options.useAsmrOneRecommender}
        onCheckedChange={checked => setOptions(d => {
          d.useAsmrOneRecommender = checked;
        })}
      >
        使用 ASMR.ONE 的推荐
      </SettingItem>

      <SettingItem
        id="show-work-details"
        checked={options.showWorkDetail}
        onCheckedChange={checked => setOptions(d => {
          d.showWorkDetail = checked;
        })}
      >
        作品详情页显示详细信息
      </SettingItem>

      <SmartPathSettings
        options={options.smartPath}
        setOptions={(key, value) => setOptions(d => {
          d.smartPath[key] = value;
        })}
      />

      <Separator />

      <SettingItem
        id="storage-enabled"
        checked={storage.enabled}
        onCheckedChange={checked => {
          setOptions(d => {
            d.storage.enabled = checked;
            if (!checked) {
              d.storage.showMissingTags = false;
              d.storage.transcode.enabled = false;
              setTranscodeTemp(d => { d.enabled = false; });
            }
          });
        }}
      >
        使用本地音声库
      </SettingItem>

      <SettingItem
        id="storage-show-missing-tags"
        checked={storage.showMissingTags}
        onCheckedChange={checked => setOptions(d => {
          d.storage.showMissingTags = checked;
        })}
        disabled={!storage.enabled}
      >
        当启用本地库时显示不存在于本地库的标签
      </SettingItem>

      <SettingItem
        id="storage-fallback-to-asmr-one-api"
        checked={storage.fallbackToAsmrOneApi}
        onCheckedChange={checked => setOptions(d => {
          d.storage.fallbackToAsmrOneApi = checked;
        })}
        disabled={!storage.enabled}
      >
        无法在本地库中找到音声时使用 ASMR.ONE
      </SettingItem>

      <TranscodeSettings disabled={!storage.enabled} />

      <Separator />

      <Suspense fallback={<StorageSkeleton />}>
        <StorageSettings />
      </Suspense>

      <Separator />

      <div className="flex gap-2">
        <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 p-1">
          <a href="https://asmr.one" target="_blank" rel="noreferrer noopener">
            ASMR.ONE
          </a>
        </Button>
        <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 p-1">
          <a href="https://github.com/kahosan/asmr-collections" target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </Button>
        <Button asChild variant="link" size="sm" className="w-max hover:opacity-80 p-1">
          <a href="https://dlsite.com" target="_blank" rel="noreferrer noopener">
            DLsite
          </a>
        </Button>
      </div>
    </motion.div>
  );
}

const Route = createLazyRoute('/settings')({
  component: Settings
});

export default Route;
