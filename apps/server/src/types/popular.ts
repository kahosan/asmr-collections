/**
 * A normalized item returned by a provider's popular endpoint.
 *
 * Third-party providers expose different response shapes. The discovery
 * engine only needs the work number and its position in the provider ranking,
 * so each adapter should normalize its response to this contract.
 */
export interface PopularWork {
  id: string
  /** Zero-based position in the provider ranking; lower is more popular. */
  rank: number
}

export type PopularWorks = PopularWork[];
