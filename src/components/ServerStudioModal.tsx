import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Check, 
  Play, 
  Radio, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  ExternalLink,
  Cpu,
  Activity
} from 'lucide-react';
import { 
  EMBED_SERVERS, 
  EmbedServer, 
  getSavedServerId, 
  savePreferredServerId 
} from '../services/hlsStreams';

interface ServerStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectServer?: (serverId: string) => void;
}

export const ServerStudioModal: React.FC<ServerStudioModalProps> = ({
  isOpen,
  onClose,
  onSelectServer,
}) => {
  const [activeServerId, setActiveServerId] = useState<string>(getSavedServerId());
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetDefault = (id: string) => {
    savePreferredServerId(id);
    setActiveServerId(id);
    if (onSelectServer) {
      onSelectServer(id);
    }
  };

  const filteredServers = EMBED_SERVERS.filter((s) => 
    s.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-4xl glass-dropdown rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-scale-up my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-light mb-1.5">
              <span className="text-amber-400 font-medium">Distributed Stream Mesh</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>14 Primary CDN Nodes</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-mono">100% Operational</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
              Stream Servers & Providers
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1 max-w-xl">
              Configure your preferred streaming provider. All video engines are equipped with automatic failover, adaptive bitrate transcoding, and multi-audio support.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Search / Filter */}
        <div className="px-6 sm:px-8 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Filter providers (Vidking, VidSrc, VidLink, Embed.su...)"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full max-w-md font-light"
          />
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline whitespace-nowrap">
            {filteredServers.length} Providers Available
          </span>
        </div>

        {/* Server Cards List */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-3 flex-1 no-scrollbar">
          {/* HLS Native Ultra Engine Option */}
          <div 
            onClick={() => handleSetDefault('hls-ultra')}
            className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              activeServerId === 'hls-ultra'
                ? 'bg-amber-400/10 border-amber-400/40 ring-1 ring-amber-400/20'
                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeServerId === 'hls-ultra' ? 'bg-amber-400 text-black' : 'bg-white/10 text-amber-400'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-medium text-white">
                    HLS.js Native Adaptive Engine
                  </h3>
                  <span className="text-xs font-mono text-amber-400">Master Stream</span>
                </div>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Direct master manifests (.m3u8), frame-accurate scrubbing, custom transcoding quality (4K, 1080p, 720p).
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500 font-mono">
                  <span>Latency: ~18ms</span>
                  <span aria-hidden="true">·</span>
                  <span>Audio: Dolby Atmos</span>
                  <span aria-hidden="true">·</span>
                  <span>Engine: HTML5 Video API</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {activeServerId === 'hls-ultra' ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  Active Default
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault('hls-ultra');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>

          {/* Embed Servers */}
          {filteredServers.map((server) => {
            const isActive = activeServerId === server.id;
            return (
              <div
                key={server.id}
                onClick={() => handleSetDefault(server.id)}
                className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-amber-400/10 border-amber-400/40 ring-1 ring-amber-400/20'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-300'
                  }`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-medium text-white">
                        {server.label}
                      </h3>
                      {server.badge && (
                        <span className="text-[11px] font-mono text-amber-300">
                          {server.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">
                      {server.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500 font-mono">
                      <span>Tag: {server.tag}</span>
                      <span aria-hidden="true">·</span>
                      <span>Format: Embed Sandbox</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">Node Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isActive ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      Active Default
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetDefault(server.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notes */}
        <div className="p-4 sm:p-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Automatic seamless fallback triggers if any video source encounters regional blocks.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition cursor-pointer self-end sm:self-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
