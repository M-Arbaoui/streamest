import { StreamSource, TranscodeProfile } from '../types';

export const TRANSCODE_PROFILES: TranscodeProfile[] = [
  {
    id: 'auto',
    label: 'Auto (ABR Engine)',
    resolution: 'Dynamic',
    height: 0,
    bitrateKbps: 0,
    fps: 60,
    codec: 'Adaptive Bitrate Transcode',
    audioBitrateKbps: 256,
    isAuto: true,
  },
  {
    id: '4k',
    label: '4K UHD Cinema',
    resolution: '3840x2160',
    height: 2160,
    bitrateKbps: 18500,
    fps: 60,
    codec: 'HEVC / AV1 Cinema Master',
    audioBitrateKbps: 320,
  },
  {
    id: '1080p',
    label: '1080p Full HD',
    resolution: '1920x1080',
    height: 1080,
    bitrateKbps: 6200,
    fps: 60,
    codec: 'H.264 High Profile',
    audioBitrateKbps: 256,
  },
  {
    id: '720p',
    label: '720p High Def',
    resolution: '1280x720',
    height: 720,
    bitrateKbps: 3400,
    fps: 30,
    codec: 'H.264 Main Profile',
    audioBitrateKbps: 192,
  },
  {
    id: '480p',
    label: '480p Standard',
    resolution: '854x480',
    height: 480,
    bitrateKbps: 1400,
    fps: 30,
    codec: 'H.264 Baseline',
    audioBitrateKbps: 128,
  },
  {
    id: '360p',
    label: '360p Data Saver',
    resolution: '640x360',
    height: 360,
    bitrateKbps: 650,
    fps: 24,
    codec: 'H.264 Low Latency',
    audioBitrateKbps: 96,
  },
];

// Curated high quality multi-bitrate HLS streams that support cross-origin streaming
export const SAMPLE_HLS_STREAMS = [
  {
    title: 'Tears of Steel (4K Sci-Fi Adaptive HLS)',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    fallbackMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://image.tmdb.org/t/p/w1280/r2J02Z2OpNTctfOSN2Ydgii51I3.jpg',
  },
  {
    title: 'Big Buck Bunny (Master Multi-Bitrate HLS)',
    hlsUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    fallbackMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
  },
  {
    title: 'Sintel (Cinema Animation HLS)',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    fallbackMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    poster: 'https://image.tmdb.org/t/p/w1280/9l1eZiJHmhr5jY76vi5Ag9AcNVg.jpg',
  },
  {
    title: 'Elephant\'s Dream (Open Media HLS)',
    hlsUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    fallbackMp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://image.tmdb.org/t/p/w1280/8Z020Vn0c49U4v44u76u6s7k.jpg',
  },
];

export interface EmbedServer {
  id: string;
  label: string;
  tag: string;
  badge?: string;
  description: string;
  movie: (id: number) => string;
  tv: (id: number, s: number, e: number) => string;
}

export const EMBED_SERVERS: EmbedServer[] = [
  {
    id: 'vidking',
    label: 'Vidking Pro',
    tag: '⭐ Recommended',
    badge: 'FASTEST',
    description: 'Ultra fast streaming with cinema color grade styling and auto-play.',
    movie: (id: number) => `https://www.vidking.net/embed/movie/${id}?color=c9a96e&autoPlay=1`,
    tv: (id: number, s = 1, e = 1) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=c9a96e&autoPlay=1`,
  },
  {
    id: 'vidsrc_xyz',
    label: 'VidSrc XYZ',
    tag: '🔥 Reliable',
    badge: '1080P/4K',
    description: 'High reliability flagship VidSrc server with multi-audio support.',
    movie: (id: number) => `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
    tv: (id: number, s = 1, e = 1) => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'vidsrc_to',
    label: 'VidSrc To',
    tag: '⚡ Popular',
    badge: 'POPULAR',
    description: 'Widely popular VidSrc source with high uptime and smooth buffering.',
    movie: (id: number) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidlink',
    label: 'VidLink PRO',
    tag: '💎 Modern',
    badge: 'CLEAN',
    description: 'Sleek, ad-minimized modern player with instant start and crystal clarity.',
    movie: (id: number) => `https://vidlink.pro/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc_cc',
    label: 'VidSrc CC / SBS',
    tag: '🌐 Low Latency',
    badge: 'NEW',
    description: 'Next-gen VidSrc v2 mirrors with fast CDN routing and multi-subs.',
    movie: (id: number) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'superembed',
    label: 'SuperEmbed (Multi)',
    tag: 'HD Stream',
    badge: 'MULTI-CDN',
    description: 'Direct stream engine scanning multiple redundant CDNs in parallel.',
    movie: (id: number) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    tv: (id: number, s = 1, e = 1) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: 'embedsu',
    label: 'Embed.su',
    tag: '⚡ High Bitrate',
    badge: 'CDN',
    description: 'High-bitrate streams with fast initial handshake and seamless playback.',
    movie: (id: number) => `https://embed.su/embed/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'autoembed',
    label: 'AutoEmbed Player',
    tag: 'Smart Fallback',
    badge: 'AUTO',
    description: 'Smart auto-switching source that rotates mirrors automatically.',
    movie: (id: number) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc2',
    label: 'VidSrc ME v2',
    tag: 'Classic',
    badge: 'V2',
    description: 'Classic reliable VidSrc server hosted on high-capacity global edges.',
    movie: (id: number) => `https://v2.vidsrc.me/embed/${id}/`,
    tv: (id: number, s = 1, e = 1) => `https://v2.vidsrc.me/embed/${id}/${s}-${e}/`,
  },
  {
    id: 'videasy',
    label: 'Videasy Net',
    tag: 'Low Data',
    badge: 'FAST',
    description: 'Lightweight video player designed for instant start and low overhead.',
    movie: (id: number) => `https://player.videasy.net/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
  },
  {
    id: 'smashystream',
    label: 'SmashyStream',
    tag: 'Alternative',
    badge: 'ALT',
    description: 'Alternate movie and TV streamer with multiple mirror servers built-in.',
    movie: (id: number) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    tv: (id: number, s = 1, e = 1) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'moviesapi',
    label: 'MoviesAPI Club',
    tag: 'Cinema HD',
    badge: 'HD',
    description: 'Dedicated club source with 1080p high definition media tracks.',
    movie: (id: number) => `https://moviesapi.club/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://moviesapi.club/tv/${id}-${s}-${e}`,
  },
  {
    id: 'twoembed',
    label: '2Embed Cinema Hub',
    tag: 'Backup',
    badge: 'BACKUP',
    description: 'Reliable secondary cinema source with extensive back-catalog.',
    movie: (id: number) => `https://www.2embed.cc/embed/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'vidnest',
    label: 'VidNest Online',
    tag: 'Stream Mirror',
    badge: 'MIRROR',
    description: 'Global mirror network ensuring streaming continuity if others fail.',
    movie: (id: number) => `https://vidnest.online/embed/movie/${id}`,
    tv: (id: number, s = 1, e = 1) => `https://vidnest.online/embed/tv/${id}/${s}/${e}`,
  },
];

export function getSavedServerId(): string {
  try {
    return localStorage.getItem('wt_preferred_server') || 'vidking';
  } catch {
    return 'vidking';
  }
}

export function savePreferredServerId(id: string): void {
  try {
    localStorage.setItem('wt_preferred_server', id);
  } catch {}
}

export function getStreamUrlForMedia(mediaId: number, mediaType: 'movie' | 'tv' = 'movie', season = 1, episode = 1): {
  hlsUrl: string;
  fallbackMp4: string;
} {
  const index = Math.abs(mediaId) % SAMPLE_HLS_STREAMS.length;
  const sample = SAMPLE_HLS_STREAMS[index];
  return {
    hlsUrl: sample.hlsUrl,
    fallbackMp4: sample.fallbackMp4,
  };
}
