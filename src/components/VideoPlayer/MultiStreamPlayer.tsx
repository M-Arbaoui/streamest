import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { 
  X, 
  Layers, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Radio,
  Tv
} from 'lucide-react';
import { LIVE_CHANNELS } from '../../services/liveService';
import { SAMPLE_HLS_STREAMS } from '../../services/hlsStreams';

interface MultiStreamPlayerProps {
  onClose: () => void;
}

export const MultiStreamPlayer: React.FC<MultiStreamPlayerProps> = ({ onClose }) => {
  const [stream1Url, setStream1Url] = useState(SAMPLE_HLS_STREAMS[0].hlsUrl);
  const [stream2Url, setStream2Url] = useState(SAMPLE_HLS_STREAMS[1].hlsUrl);
  const [layout, setLayout] = useState<'split' | 'pip' | 'vertical'>('split');
  const [activeAudioSlot, setActiveAudioSlot] = useState<1 | 2>(1);

  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const hls1Ref = useRef<Hls | null>(null);
  const hls2Ref = useRef<Hls | null>(null);

  const [isPlaying1, setIsPlaying1] = useState(true);
  const [isPlaying2, setIsPlaying2] = useState(true);

  // Setup HLS instance 1
  useEffect(() => {
    const video = video1Ref.current;
    if (!video) return;

    if (hls1Ref.current) hls1Ref.current.destroy();

    if (Hls.isSupported() && stream1Url.includes('.m3u8')) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(stream1Url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls1Ref.current = hls;
    } else {
      video.src = stream1Url;
      video.play().catch(() => {});
    }

    return () => {
      if (hls1Ref.current) hls1Ref.current.destroy();
    };
  }, [stream1Url]);

  // Setup HLS instance 2
  useEffect(() => {
    const video = video2Ref.current;
    if (!video) return;

    if (hls2Ref.current) hls2Ref.current.destroy();

    if (Hls.isSupported() && stream2Url.includes('.m3u8')) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(stream2Url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls2Ref.current = hls;
    } else {
      video.src = stream2Url;
      video.play().catch(() => {});
    }

    return () => {
      if (hls2Ref.current) hls2Ref.current.destroy();
    };
  }, [stream2Url]);

  // Handle Audio Focus switching
  useEffect(() => {
    if (video1Ref.current) {
      video1Ref.current.muted = activeAudioSlot !== 1;
    }
    if (video2Ref.current) {
      video2Ref.current.muted = activeAudioSlot !== 2;
    }
  }, [activeAudioSlot]);

  return (
    <div className="fixed inset-0 z-50 bg-[#08080a] flex flex-col">
      {/* Top Header Bar */}
      <div className="px-6 py-3 bg-zinc-950/90 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-base">Cinema Multi-Watch Engine</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-400 text-black font-extrabold rounded">
                DUAL HLS
              </span>
            </div>
            <p className="text-xs text-zinc-400">Watch two high-definition streams simultaneously</p>
          </div>
        </div>

        {/* Layout Switcher & Close */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setLayout('split')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                layout === 'split' ? 'bg-amber-400 text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              50 / 50 Split
            </button>
            <button
              onClick={() => setLayout('pip')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                layout === 'pip' ? 'bg-amber-400 text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Picture-in-Picture
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Dual Player Canvas */}
      <div className="flex-1 relative p-4 flex gap-4 overflow-hidden">
        {/* Stream 1 Viewport */}
        <div
          className={`relative rounded-2xl overflow-hidden border border-white/10 bg-black flex flex-col transition-all duration-300 ${
            layout === 'split' ? 'flex-1' : layout === 'pip' ? 'w-full h-full' : 'flex-1'
          }`}
        >
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
              Primary Screen
            </span>
            <button
              onClick={() => setActiveAudioSlot(1)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeAudioSlot === 1
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-black/70 text-zinc-400 hover:text-white'
              }`}
            >
              {activeAudioSlot === 1 ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {activeAudioSlot === 1 ? 'Audio Active' : 'Muted'}
            </button>
          </div>

          <video
            ref={video1Ref}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => {
              if (video1Ref.current?.paused) {
                video1Ref.current.play();
                setIsPlaying1(true);
              } else {
                video1Ref.current?.pause();
                setIsPlaying1(false);
              }
            }}
            playsInline
          />
        </div>

        {/* Stream 2 Viewport */}
        <div
          className={`rounded-2xl overflow-hidden border border-white/10 bg-black flex flex-col transition-all duration-300 ${
            layout === 'split'
              ? 'flex-1 relative'
              : 'absolute bottom-8 right-8 w-80 h-48 z-30 shadow-2xl ring-2 ring-amber-400/50'
          }`}
        >
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-semibold text-white border border-white/10">
              Secondary Stream
            </span>
            <button
              onClick={() => setActiveAudioSlot(2)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeAudioSlot === 2
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-black/70 text-zinc-400 hover:text-white'
              }`}
            >
              {activeAudioSlot === 2 ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {activeAudioSlot === 2 ? 'Audio Active' : 'Muted'}
            </button>
          </div>

          <video
            ref={video2Ref}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => {
              if (video2Ref.current?.paused) {
                video2Ref.current.play();
                setIsPlaying2(true);
              } else {
                video2Ref.current?.pause();
                setIsPlaying2(false);
              }
            }}
            playsInline
          />
        </div>
      </div>

      {/* Stream Selector Drawer */}
      <div className="px-6 py-3 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Stream 1 Channel:</span>
            <select
              value={stream1Url}
              onChange={(e) => setStream1Url(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs"
            >
              {SAMPLE_HLS_STREAMS.map((s, i) => (
                <option key={i} value={s.hlsUrl}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Stream 2 Channel:</span>
            <select
              value={stream2Url}
              onChange={(e) => setStream2Url(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs"
            >
              {LIVE_CHANNELS.map((ch) => (
                <option key={ch.id} value={ch.hlsUrl}>
                  [LIVE] {ch.title}
                </option>
              ))}
              {SAMPLE_HLS_STREAMS.map((s, i) => (
                <option key={`s2_${i}`} value={s.hlsUrl}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-zinc-500 font-mono text-[11px]">
          Both streams powered by high-throughput HLS.js adaptive engines
        </span>
      </div>
    </div>
  );
};
