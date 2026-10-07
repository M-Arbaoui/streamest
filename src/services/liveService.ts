import { ChatMessage, LiveChannel } from '../types';

export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'cinema-live',
    title: 'Watchy Cinema Club 24/7 (4K Master Feed)',
    streamerName: 'Watchy Official',
    streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    category: 'Cinema Masterclass',
    viewers: 18450,
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    fallbackVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520fr.jpg',
    currentShow: 'Tears of Steel (4K Cinema Cut)',
    nextShow: 'Interstellar Behind The Scenes & IMAX Special',
    startedAt: '3 hours ago',
    bitrate: '8,600 kbps (Transcoding ABR)',
    fps: 60,
    resolution: '3840x2160 (4K)',
    pinnedNotice: '🎬 Community Watch Party in progress! Chat in real-time below.',
  },
  {
    id: 'anime-247',
    title: 'Anime Premiere Hub & Sintel Studio Showcase',
    streamerName: 'Tokyo Animation Lab',
    streamerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    category: 'Animation & CGI',
    viewers: 9240,
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    fallbackVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w1280/2meX1nMdScFOoV4370rqHWFDxZ0.jpg',
    currentShow: 'Sintel: The Dragon Hunt Special',
    nextShow: 'Arcane Season 2 Deep Dive Analysis',
    startedAt: '1 hour ago',
    bitrate: '5,800 kbps',
    fps: 60,
    resolution: '1920x1080 (FHD)',
    pinnedNotice: '✨ Subtitles available in EN, ES, FR, JP. Switch in player menu.',
  },
  {
    id: 'action-live',
    title: 'Big Buck Bunny High-Frame Masterstream (60FPS HDR)',
    streamerName: 'Blender Cinema Project',
    streamerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    category: 'Open Source 4K',
    viewers: 6180,
    hlsUrl: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    fallbackVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    currentShow: 'Big Buck Bunny 4K 60FPS Remaster',
    nextShow: 'Cosmos Laundromat 360 Experiment',
    startedAt: '45 mins ago',
    bitrate: '7,200 kbps',
    fps: 60,
    resolution: '3840x2160',
    pinnedNotice: '🐰 Ultra low-latency playback enabled (~0.6s glass-to-glass)',
  },
  {
    id: 'director-lounge',
    title: 'Director\'s Commentary: Elephant\'s Dream Special Cut',
    streamerName: 'Cinema Guild Collective',
    streamerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    category: 'Film Discussion',
    viewers: 4320,
    hlsUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    fallbackVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w1280/8Z020Vn0c49U4v44u76u6s7k.jpg',
    currentShow: 'Elephant\'s Dream: The Original Pioneer',
    nextShow: 'Sci-Fi Worldbuilding Roundtable',
    startedAt: '2 hours ago',
    bitrate: '6,400 kbps',
    fps: 30,
    resolution: '1920x1080',
  },
];

const AUDIENCE_NAMES = [
  'Maya_Cinema', 'LucasH', 'Elena_R', 'NicoSky', 'AuraStreamer', 
  'KaiZen', 'PixelMaster', 'Sarah_V', 'DuneFanatic', 'SamuraiJack',
  'TokyoDrifter', 'NovaCinephile', 'Chris_Atmos', 'Zoe_Director',
];

const SAMPLE_COMMENTS = [
  'The bitrate on this 4K stream is unbelievable!',
  'That color grade in the desert scene looks glorious ✨',
  'Watchy Pro player is so smooth, zero buffering even on 4K',
  'Who is directing the audio mix? Dolby Atmos sounds immense 🎧',
  'Can we rewatch that sequence? Mind blowing visuals',
  'The dynamic transcoding switched instantly when my wifi dipped',
  'Loving this clean cinema interface, no clutter at all',
  'Watch party vibe is top tier tonight!',
  'HLS stream health is 100% green 🟢',
  'Such an underrated sequence right here!',
  'Hands down the best streaming experience 🔥🔥🔥',
];

class LiveService {
  private channels = [...LIVE_CHANNELS];
  private chatMessages = new Map<string, ChatMessage[]>();
  private listeners = new Map<string, Array<(messages: ChatMessage[]) => void>>();
  private viewerListeners = new Map<string, Array<(viewers: number) => void>>();
  private tickerInterval: number | null = null;

  constructor() {
    this.initChatData();
    this.startSimulation();
  }

  private initChatData(): void {
    this.channels.forEach((ch) => {
      const initial: ChatMessage[] = [
        {
          id: `msg_init_1_${ch.id}`,
          username: 'WatchyBot',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80',
          text: `Welcome to ${ch.title}! High-definition HLS stream is live. Enjoy the cinema experience.`,
          timestamp: 'Just now',
          isMod: true,
          badge: 'MOD',
          color: '#f59e0b',
        },
        {
          id: `msg_init_2_${ch.id}`,
          username: 'CinemaVIP',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
          text: 'Audio synchronized and 4K stream locked in 🚀',
          timestamp: '1m ago',
          isVip: true,
          badge: 'PRO VIP',
          color: '#60a5fa',
        },
      ];
      this.chatMessages.set(ch.id, initial);
    });
  }

  private startSimulation(): void {
    if (this.tickerInterval) return;

    // Periodically generate dynamic chat and viewer flux
    this.tickerInterval = window.setInterval(() => {
      this.channels.forEach((ch) => {
        // Flux viewer count (+/- 15 viewers)
        const delta = Math.floor(Math.random() * 31) - 15;
        ch.viewers = Math.max(1000, ch.viewers + delta);
        this.notifyViewers(ch.id, ch.viewers);

        // 35% chance to post a spontaneous comment
        if (Math.random() < 0.35) {
          const author = AUDIENCE_NAMES[Math.floor(Math.random() * AUDIENCE_NAMES.length)];
          const text = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
          this.postMessage(ch.id, author, text, false);
        }
      });
    }, 3800);
  }

  getChannels(): LiveChannel[] {
    return [...this.channels];
  }

  getChannel(id: string): LiveChannel | undefined {
    return this.channels.find((c) => c.id === id);
  }

  subscribeChat(channelId: string, listener: (messages: ChatMessage[]) => void): () => void {
    if (!this.listeners.has(channelId)) {
      this.listeners.set(channelId, []);
    }
    this.listeners.get(channelId)!.push(listener);
    listener([...(this.chatMessages.get(channelId) || [])]);

    return () => {
      const arr = this.listeners.get(channelId) || [];
      this.listeners.set(channelId, arr.filter((l) => l !== listener));
    };
  }

  subscribeViewers(channelId: string, listener: (viewers: number) => void): () => void {
    if (!this.viewerListeners.has(channelId)) {
      this.viewerListeners.set(channelId, []);
    }
    this.viewerListeners.get(channelId)!.push(listener);
    const ch = this.getChannel(channelId);
    if (ch) listener(ch.viewers);

    return () => {
      const arr = this.viewerListeners.get(channelId) || [];
      this.viewerListeners.set(channelId, arr.filter((l) => l !== listener));
    };
  }

  private notifyViewers(channelId: string, viewers: number): void {
    const list = this.viewerListeners.get(channelId);
    if (list) {
      list.forEach((l) => l(viewers));
    }
  }

  postMessage(channelId: string, username: string, text: string, isUser = false, avatar?: string): ChatMessage {
    const messages = this.chatMessages.get(channelId) || [];
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      username,
      avatar: avatar || `https://images.unsplash.com/photo-${1534528741775 + (username.length * 1000)}?auto=format&fit=crop&w=150&h=150&q=80`,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVip: isUser,
      badge: isUser ? 'YOU' : undefined,
      color: isUser ? '#f59e0b' : '#e4e4e7',
    };

    messages.push(newMsg);
    if (messages.length > 50) messages.shift();
    this.chatMessages.set(channelId, messages);

    const list = this.listeners.get(channelId);
    if (list) {
      list.forEach((l) => l([...messages]));
    }
    return newMsg;
  }
}

export const liveService = new LiveService();
