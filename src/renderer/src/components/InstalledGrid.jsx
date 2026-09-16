import React, { useState } from 'react';
import { Play, FolderOpen, Trash2, Star, Search, AlertCircle, HardDrive, Cpu, ExternalLink } from 'lucide-react';

export default function InstalledGrid({
  installedVersions,
  onLaunch,
  onOpenFolder,
  onUninstall,
  onToggleFavorite,
  onNavigateToReleases
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [confirmUninstallId, setConfirmUninstallId] = useState(null);

  // Format bytes into human readable format
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredVersions = installedVersions.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.versionTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.executablePath.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTag === 'v4') return v.versionTag.includes('4.') || v.name.includes('4.');
    if (filterTag === 'v3') return v.versionTag.includes('3.') || v.name.includes('3.');
    if (filterTag === 'mono') return v.isMono;
    if (filterTag === 'fav') return v.isFavorite;

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-godot-dark">
      {/* Top Header & Search Bar */}
      <div className="p-6 pb-4 border-b border-godot-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Installed Versions</h2>
          <p className="text-xs text-gray-400 mt-1">Manage and launch your downloaded Godot versions</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search installed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-godot-sidebar border border-godot-border text-sm rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-godot-blue"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 border-b border-godot-border flex items-center space-x-2 text-xs">
        {[
          { id: 'all', label: 'All Versions' },
          { id: 'fav', label: 'Favorites' },
          { id: 'v4', label: 'Godot 4.x' },
          { id: 'v3', label: 'Godot 3.x' },
          { id: 'mono', label: 'Mono (.NET)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTag(tab.id)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterTag === tab.id
                ? 'bg-godot-blue text-white'
                : 'bg-godot-card text-gray-400 hover:text-white hover:bg-godot-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredVersions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-godot-card border border-godot-border flex items-center justify-center mb-4 text-gray-500">
              <HardDrive className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-gray-200">No installed engines found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              {searchTerm || filterTag !== 'all'
                ? 'No installed version matches your filter criteria.'
                : 'You have not installed any Godot version yet.'}
            </p>
            {(!searchTerm && filterTag === 'all') && (
              <button
                onClick={onNavigateToReleases}
                className="mt-5 px-4 py-2 bg-godot-blue hover:bg-godot-hover text-white text-xs font-semibold rounded-lg shadow-md shadow-godot-blue/20 transition-all flex items-center space-x-2"
              >
                <span>Browse Available Releases</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVersions.map((v) => (
              <div
                key={v.id}
                className={`bg-godot-card border ${
                  v.existsOnDisk === false ? 'border-red-500/50' : 'border-godot-border hover:border-godot-blue/60'
                } rounded-xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-lg`}
              >
                {/* Card Top Header */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-base font-bold text-white truncate group-hover:text-godot-blue transition-colors">
                        {v.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                        {v.isMono && (
                          <span className="bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[10px] px-2 py-0.5 rounded font-semibold">
                            Mono (.NET)
                          </span>
                        )}
                        <span className="bg-godot-sidebar border border-godot-border text-gray-300 text-[10px] px-2 py-0.5 rounded font-semibold">
                          {v.platform || 'Standard'}
                        </span>
                        {v.custom && (
                          <span className="bg-amber-900/60 border border-amber-500/40 text-amber-300 text-[10px] px-2 py-0.5 rounded font-semibold">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Favorite Star */}
                    <button
                      onClick={() => onToggleFavorite(v.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        v.isFavorite
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-godot-sidebar'
                      }`}
                      title={v.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Missing File Warning if applicable */}
                  {v.existsOnDisk === false && (
                    <div className="mt-3 p-2 rounded bg-red-900/30 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Executable not found on disk</span>
                    </div>
                  )}

                  {/* Executable Path */}
                  <p className="text-[11px] text-gray-400 font-mono mt-3 truncate bg-godot-sidebar/80 p-2 rounded border border-godot-border/60" title={v.executablePath}>
                    {v.executablePath}
                  </p>

                  {/* Metadata */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Installed: {new Date(v.installedAt).toLocaleDateString()}</span>
                    <span>{formatSize(v.sizeBytes)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-godot-border/60 flex items-center justify-between gap-2">
                  {/* Launch Primary Button */}
                  <button
                    onClick={() => onLaunch(v.executablePath)}
                    disabled={v.existsOnDisk === false}
                    className="flex-1 bg-godot-blue hover:bg-godot-hover disabled:bg-gray-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md shadow-godot-blue/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch</span>
                  </button>

                  {/* Open Folder Button */}
                  <button
                    onClick={() => onOpenFolder(v.installPath)}
                    className="bg-godot-sidebar hover:bg-godot-border text-gray-300 hover:text-white p-2 rounded-lg transition-colors border border-godot-border"
                    title="Open Folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>

                  {/* Uninstall Button */}
                  <button
                    onClick={() => setConfirmUninstallId(v.id)}
                    className="bg-godot-sidebar hover:bg-red-900/40 text-gray-400 hover:text-red-400 p-2 rounded-lg transition-colors border border-godot-border"
                    title="Uninstall / Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Uninstall */}
      {confirmUninstallId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-godot-card border border-godot-border rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white">Uninstall Godot Version?</h3>
            <p className="text-xs text-gray-300 mt-2">
              This will permanently delete the extracted files from your hard drive and remove this entry from your manager.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setConfirmUninstallId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-godot-sidebar text-gray-300 hover:bg-godot-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUninstall(confirmUninstallId);
                  setConfirmUninstallId(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Uninstall</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
