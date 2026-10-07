export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number | string;
  name: string;
}

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: MediaType;
  genre_ids?: number[];
  genres?: Genre[];
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline?: string;
  trailer_key?: string;
  hls_url?: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  runtime?: number;
  air_date?: string;
  vote_average?: number;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  episode_count: number;
  poster_path: string | null;
  episodes?: Episode[];
}

export interface TranscodeProfile {
  id: string;
  label: string;
  resolution: string;
  height: number;
  bitrateKbps: number;
  fps: number;
  codec: string;
  audioBitrateKbps: number;
  isAuto?: boolean;
}

export interface StreamSource {
  id: string;
  label: string;
  tag: string;
  url: string;
  isHls: boolean;
  transcodeProfiles: TranscodeProfile[];
  backupUrl?: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  isVip?: boolean;
  isMod?: boolean;
  badge?: string;
  color?: string;
}

export interface LiveChannel {
  id: string;
  title: string;
  streamerName: string;
  streamerAvatar: string;
  category: string;
  viewers: number;
  hlsUrl: string;
  fallbackVideoUrl: string;
  thumbnail: string;
  currentShow: string;
  nextShow: string;
  startedAt: string;
  bitrate: string;
  fps: number;
  resolution: string;
  pinnedNotice?: string;
}

export interface OfflineDownload {
  id: string;
  mediaId: number;
  title: string;
  mediaType: MediaType;
  season?: number;
  episode?: number;
  posterPath: string | null;
  streamUrl: string;
  fileSizeBytes: number;
  downloadedBytes: number;
  progress: number;
  status: 'downloading' | 'completed' | 'paused' | 'failed';
  downloadedAt: number;
  durationSeconds: number;
  offlineBlobUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKid: boolean;
  pin?: string;
  accentColor: string;
  preferredQuality: string;
  playbackSpeed: number;
  autoPlayNext: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  plan: 'Free Standard' | 'Pro 4K Cinema Pass' | 'Studio VIP';
  profiles: UserProfile[];
  activeProfileId: string;
  watchlist: number[]; // media ids
  history: {
    mediaId: number;
    title: string;
    mediaType: MediaType;
    posterPath: string | null;
    backdropPath: string | null;
    season?: number;
    episode?: number;
    progressPercentage: number;
    currentTimeSeconds: number;
    durationSeconds: number;
    updatedAt: number;
  }[];
}

export type PlayerEngine = 
  | 'hls-ultra' 
  | 'multi-stream' 
  | 'direct-cinema' 
  | 'embed-bridge' 
  | 'custom-ingest';
