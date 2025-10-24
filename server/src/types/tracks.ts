export type Tracks = Track[];

export interface Track {
  type: 'folder' | 'audio' | 'image' | 'text' | 'other'
  hash?: string
  title: string
  children?: Tracks
  work?: {
    id: number
    source_id: string
    source_type: string
  }
  workTitle?: string
  mediaStreamUrl?: string
  mediaDownloadUrl?: string
  streamLowQualityUrl?: string
  duration?: number
}
