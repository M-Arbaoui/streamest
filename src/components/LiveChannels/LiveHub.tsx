import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Send, 
  Volume2, 
  VolumeX, 
  MessageSquare,
  Users
} from 'lucide-react';
import { LIVE_CHANNELS, liveService } from '../../services/liveService';
import { authService } from '../../services/authService';
import { ChatMessage, LiveChannel } from '../../types';

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}

export const LiveHub: React.FC = () => {
  const [channels] = useState<LiveChannel[]>(liveService.getChannels());
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel>(channels[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [viewers, setViewers] = useState<number>(selectedChannel.viewers);
  const [isMuted, setIsMuted] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to chat and viewers for active channel
  useEffect(() => {
    const unsubChat = liveService.subscribeChat(selectedChannel.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    const unsubViewers = liveService.subscribeViewers(selectedChannel.id, (v) => {
      setViewers(v);
    });

    return () => {
      unsubChat();
      unsubViewers();
    };
  }, [selectedChannel.id]);

  // Load HLS Live Stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && selectedChannel.hlsUrl.includes('.m3u8')) {
      const hls = new Hls({
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
      });

      hls.loadSource(selectedChannel.hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, err) => {
        if (err.fatal) {
          video.src = selectedChannel.fallbackVideoUrl;
          video.play().catch(() => {});
        }
      });

      hlsRef.current = hls;
    } else {
      video.src = selectedChannel.fallbackVideoUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const profile = authService.getActiveProfile();
    const account = authService.getAccount();
    liveService.postMessage(
      selectedChannel.id,
      profile.name || account.username,
      inputText.trim(),
      true,
      profile.avatar
    );
    setInputText('');
  };

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 60) + 20;
    setFloatingReactions((prev) => [...prev, { id, emoji, left }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-light mb-1">
            <span className="text-amber-400 font-medium">Synchronized Screening</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Global Audience</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>4K Master Feed</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif text-white tracking-tight">
            Live Cinema Salon
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1 max-w-xl">
            Communal screening rooms streaming synchronized master cuts with real-time dialogue.
          </p>
        </div>

        {/* Channel Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          {channels.map((ch) => {
            const isSelected = ch.id === selectedChannel.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {ch.title.split('(')[0].trim()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Cinema Stream (Left) + Communal Dialogue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stream Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
            {/* Live Video */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={isMuted}
            />

            {/* Floating Reactions Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {floatingReactions.map((r) => (
                <div
                  key={r.id}
                  className="absolute bottom-6 text-2xl animate-float-heart select-none"
                  style={{ left: `${r.left}%` }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>

            {/* Top Quiet Status Bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-zinc-200 text-xs font-light flex items-center gap-1.5 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Live Now
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-zinc-300 text-xs font-light flex items-center gap-1.5 border border-white/10">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  {viewers.toLocaleString()} watching
                </span>
              </div>

              <div className="pointer-events-auto">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-md bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors border border-white/10 cursor-pointer"
                  aria-label="Toggle mute"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bottom Floating Reaction Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 opacity-90 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-light hidden sm:inline">Communal reactions:</span>
                <div className="flex items-center gap-1">
                  {['🔥', '❤️', '🍿', '⭐', '👏'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="px-2 py-0.5 rounded-lg hover:bg-white/10 transition text-sm cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-[11px] font-mono text-zinc-400">
                {selectedChannel.resolution} · {selectedChannel.fps}fps
              </span>
            </div>
          </div>

          {/* Program Guide */}
          <div className="p-5 glass-panel rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div>
                <h3 className="text-base sm:text-lg font-serif text-white">{selectedChannel.title}</h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Curated by {selectedChannel.streamerName} · {selectedChannel.category}
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                Started {selectedChannel.startedAt}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-medium block mb-0.5">
                  Now Airing
                </span>
                <p className="font-medium text-white text-sm">{selectedChannel.currentShow}</p>
                <p className="text-zinc-400 text-[11px] mt-0.5 font-light">Continuous high-fidelity playback with synced audio</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium block mb-0.5">
                  Up Next
                </span>
                <p className="font-medium text-zinc-200 text-sm">{selectedChannel.nextShow}</p>
                <p className="text-zinc-500 text-[11px] mt-0.5 font-light">Scheduled to begin shortly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Communal Dialogue Feed */}
        <div className="lg:col-span-4 flex flex-col h-[580px] glass-panel rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400/90" />
              <h3 className="text-sm font-medium text-white">Live Dialogue</h3>
            </div>
            <span className="text-[11px] text-zinc-400 font-light flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Synced
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2.5 text-xs">
                <img
                  src={msg.avatar}
                  alt={msg.username}
                  className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="font-medium text-zinc-200 truncate">{msg.username}</span>
                    {msg.badge === 'YOU' && (
                      <span className="text-[9px] text-amber-400 font-mono">· you</span>
                    )}
                    <span className="text-[10px] text-zinc-500 ml-auto font-light">{msg.timestamp}</span>
                  </div>
                  <p className="text-zinc-300 font-light leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Join the cinema dialogue..."
              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
