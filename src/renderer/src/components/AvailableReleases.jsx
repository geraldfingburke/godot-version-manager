import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle, Search, Filter, ShieldCheck, Sparkles, Calendar, Layers, Monitor } from 'lucide-react';

export default function AvailableReleases({ installedVersions, onInstallAsset, onRefresh, releases, loading, error }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [releaseType, setReleaseType] = useState('all'); // all, stable, prerelease
  const [edition, setEdition] = useState('all'); // all, standard, mono
  const [targetPlatform, setTargetPlatform] = useState('all'); // all, windows, macos, linux

  const isAssetInstalled = (asset) => {
    const cleanName = asset.name.replace(/\.(zip|tar\.xz)$/i, '');
    return installedVersions.some((v) => v.id === cleanName || v.versionTag === cleanName);
  };

  const filteredReleases = (releases || []).filter((rel) => {
    if (releaseType === 'stable' && !rel.isStable) return false;
    if (releaseType === 'prerelease' && !rel.isPrerelease) return false;

    if (searchTerm) {
      const matchTag = rel.tagName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchName = rel.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchTag && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-godot-dark">
      {/* Top Header Bar */}
      <div className="p-6 pb-4 border-b border-godot-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Available Godot Releases</h2>
          <p className="text-xs text-gray-400 mt-1">Browse and install official Godot Engine binaries from GitHub</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={() => onRefresh(true)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-godot-card hover:bg-godot-border text-gray-300 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-2 border border-godot-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Search Input */}
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter versions (e.g. 4.3)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-godot-sidebar border border-godot-border text-sm rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-godot-blue"
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-godot-border flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Release Type Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 font-medium flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'stable', label: 'Stable' },
            { id: 'prerelease', label: 'Dev/RC' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setReleaseType(t.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                releaseType === t.id
                  ? 'bg-godot-blue text-white'
                  : 'bg-godot-card text-gray-400 hover:text-white hover:bg-godot-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Target Platform Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 font-medium flex items-center space-x-1">
            <Monitor className="w-3.5 h-3.5" />
            <span>Target Platform:</span>
          </span>
          {[
            { id: 'all', label: 'All Platforms' },
            { id: 'windows', label: 'Windows' },
            { id: 'macos', label: 'macOS' },
            { id: 'linux', label: 'Linux' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setTargetPlatform(p.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                targetPlatform === p.id
                  ? 'bg-godot-blue text-white'
                  : 'bg-godot-card text-gray-400 hover:text-white hover:bg-godot-border'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Edition Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 font-medium flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Edition:</span>
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'standard', label: 'Standard' },
            { id: 'mono', label: 'Mono (.NET)' },
          ].map((e) => (
            <button
              key={e.id}
              onClick={() => setEdition(e.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                edition === e.id
                  ? 'bg-godot-blue text-white'
                  : 'bg-godot-card text-gray-400 hover:text-white hover:bg-godot-border'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Releases List */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-godot-blue mb-3" />
            <p className="text-sm font-medium">Fetching official Godot releases...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-center max-w-md mx-auto my-12">
            <p className="font-semibold text-sm">Failed to fetch releases</p>
            <p className="text-xs mt-1 text-red-400">{error}</p>
            <button
              onClick={() => onRefresh(true)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No releases match your filter criteria.</p>
          </div>
        ) : (
          filteredReleases.map((release) => {
            const filteredAssets = release.assets.filter((asset) => {
              if (edition === 'standard' && asset.isMono) return false;
              if (edition === 'mono' && !asset.isMono) return false;

              if (targetPlatform === 'windows') {
                if (asset.platform !== 'win64' && asset.platform !== 'win32') return false;
              } else if (targetPlatform === 'macos') {
                if (asset.platform !== 'macos') return false;
              } else if (targetPlatform === 'linux') {
                if (!asset.platform.includes('linux')) return false;
              }

              return true;
            });

            if (filteredAssets.length === 0) return null;

            return (
              <div
                key={release.id}
                className="bg-godot-card border border-godot-border rounded-xl p-5 shadow-md"
              >
                {/* Release Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-godot-border/60 pb-3 gap-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-white">{release.name || release.tagName}</h3>
                    {release.isStable ? (
                      <span className="bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Stable</span>
                      </span>
                    ) : (
                      <span className="bg-amber-900/60 border border-amber-500/40 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Dev / Pre-release</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(release.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Assets Grid */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAssets.map((asset) => {
                    const installed = isAssetInstalled(asset);
                    return (
                      <div
                        key={asset.id}
                        className={`p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                          asset.isCompatible
                            ? 'bg-godot-sidebar border-godot-border hover:border-godot-blue/60'
                            : 'bg-godot-sidebar/50 border-godot-border/40 opacity-70'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-gray-200 truncate" title={asset.name}>
                              {asset.name}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-godot-dark text-gray-300 font-medium">
                              {asset.platform}
                            </span>
                            {asset.isMono && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-medium">
                                Mono (.NET)
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {(asset.size / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </div>
                        </div>

                        {/* Install / Installed Button */}
                        {installed ? (
                          <div className="px-3 py-1.5 bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shrink-0">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Installed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onInstallAsset(asset)}
                            className="px-3 py-1.5 bg-godot-blue hover:bg-godot-hover text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shrink-0 transition-colors shadow-md shadow-godot-blue/20"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Install</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
