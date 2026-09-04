import type { Work } from './work';
import type {
  DiscoveryHotProvider,
  DiscoveryScene,
  DiscoverySource
} from '../schemas/discovery';

export interface DiscoveryItem {
  work: Work
  reason: string
}

interface DiscoveryResponseBase {
  seed: string
  generatedAt: string
  data: DiscoveryItem[]
}

export type DiscoveryResponse =
  | (DiscoveryResponseBase & {
    scene: 'hot'
    provider: DiscoveryHotProvider
    source?: never
  })
  | (DiscoveryResponseBase & {
    scene: Exclude<DiscoveryScene, 'hot'>
    source: DiscoverySource
    provider?: never
  });
