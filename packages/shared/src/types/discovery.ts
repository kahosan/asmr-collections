import type { Data, Work } from './work';
import type {
  DiscoveryProvider,
  DiscoveryScene
} from '../schemas/discovery';

export interface DiscoveryExternalWork {
  id: string
  name: string
  cover: string
  /** Provider metadata; ASMR.ONE does not currently provide a description here. */
  intro: string | undefined
  /** Normalized provider circle/maker metadata. */
  circle: Data<string>
  /** Normalized provider tags; IDs are retained for future filtering. */
  genres: Array<Data<number>>
}

export interface DiscoveryLibraryItem {
  kind: 'library'
  work: Work
  reason: string
  /** One-based provider rank; present for external-provider hot results. */
  rank?: number
}

export interface DiscoveryExternalItem {
  kind: 'external'
  /** Metadata supplied by the selected popular provider; not persisted locally. */
  work: DiscoveryExternalWork
  provider: DiscoveryProvider
  /** One-based position in the provider ranking. */
  rank: number
}

export type DiscoveryItem = DiscoveryLibraryItem | DiscoveryExternalItem;

interface DiscoveryResponseBase {
  seed: string
  generatedAt: string
}

export type DiscoveryResponse =
  | (DiscoveryResponseBase & {
    scene: 'hot'
    provider: DiscoveryProvider
    data: DiscoveryItem[]
  })
  | (DiscoveryResponseBase & {
    scene: Exclude<DiscoveryScene, 'hot'>
    data: DiscoveryLibraryItem[]
  });
