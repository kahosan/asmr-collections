/**
 * A normalized item returned by a provider's popular endpoint.
 *
 * Third-party providers expose different response shapes. Each adapter should
 * normalize the response to the small set of fields needed to render an
 * external discovery card and to match the item against the local library.
 */
import type { DiscoveryExternalWork } from '@asmr-collections/shared';

export interface PopularWork extends DiscoveryExternalWork {
  /** One-based position in the provider ranking; lower is more popular. */
  rank: number
}

export type PopularWorks = PopularWork[];
