import { motion } from 'framer-motion';

import type { SettingOptions } from '~/hooks/use-setting-options';

import { SettingItem } from './setting-item';
import { SettingInput } from './setting-input';

interface SmartPathSettingsProps {
  options: SettingOptions['smartPath']
  setOptions: <K extends keyof SettingOptions['smartPath']>(
    key: K,
    value: SettingOptions['smartPath'][K]
  ) => void
}

export function SmartPathSettings({ options, setOptions }: SmartPathSettingsProps) {
  return (
    <div>
      <SettingItem
        id="enable-smart-path"
        checked={options.enable}
        onCheckedChange={checked => setOptions('enable', checked)}
      >
        启用智能路径
      </SettingItem>

      <motion.div
        className="mt-4 ml-4 overflow-hidden"
        initial={false}
        animate={
          options.enable
            ? {
              height: 'auto',
              opacity: 1,
              transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.15, delay: 0.05 }
              }
            }
            : {
              height: 0,
              opacity: 0,
              marginTop: 0,
              transition: {
                height: { duration: 0.2, delay: 0.05 },
                opacity: { duration: 0.15 }
              }
            }
        }
      >
        <SettingInput
          id="smart-path-pattern"
          name="smart-path-pattern"
          placeholder={options.pattern.join(',')}
          value={options.pattern.join(',')}
          onChange={e => {
            const value = e.target.value;
            setOptions('pattern', value.split(','));
          }}
        >
          音频类型偏好
        </SettingInput>
      </motion.div>
    </div>
  );
}
