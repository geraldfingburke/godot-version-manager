import React from 'react';
import { Download, CheckCircle2, AlertCircle, Loader2, Monitor } from 'lucide-react';

export default function DownloadModal({ progress, asset, onClose, error, createShortcut, setCreateShortcut }) {
  if (!progress && !error) return null;

  const phase = progress?.phase || 'downloading';
  const percent = progress?.percent || 0;
  const transferred = progress?.transferred || 0;
  const total = progress?.total || 0;
  const speedBps = progress?.speedBps || 0;

  const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1);
  const formatSpeed = (bps) => {
    if (bps > 1024 * 1024) return (bps / (1024 * 1024)).toFixed(1) + ' MB/s';
    return (bps / 1024).toFixed(0) + ' KB/s';
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-godot-card border border-godot-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-5">
        {/* Top Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-godot-blue/20 border border-godot-blue/40 text-godot-blue flex items-center justify-center shrink-0">
            {phase === 'complete' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : error ? (
              <AlertCircle className="w-6 h-6 text-red-400" />
            ) : (
              <Download className="w-5 h-5 animate-bounce" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-white truncate">
              {error ? 'Installation Failed' : phase === 'complete' ? 'Installation Complete!' : 'Installing Godot Engine'}
            </h3>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {asset?.name || 'Godot Binary'}
            </p>
          </div>
        </div>

        {/* Content Body */}
        {error ? (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        ) : phase === 'complete' ? (
          <div className="space-y-3">
            <div className="text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 p-3 rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Godot binary downloaded, extracted, and registered cleanly.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status Label & Speed */}
            <div className="flex justify-between text-xs text-gray-300 font-medium">
              <span className="flex items-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-godot-blue" />
                <span>
                  {phase === 'downloading' ? 'Downloading package...' : 'Extracting zip archive...'}
                </span>
              </span>
              {phase === 'downloading' && (
                <span>{formatSpeed(speedBps)}</span>
              )}
            </div>

            {/* Progress Bar Container */}
            <div className="w-full bg-godot-sidebar border border-godot-border rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-godot-blue h-full rounded-full transition-all duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Bytes transferred / total */}
            {phase === 'downloading' && (
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>{formatMB(transferred)} MB of {formatMB(total)} MB</span>
                <span>{percent}%</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {(phase === 'complete' || error) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-godot-blue hover:bg-godot-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-godot-blue/20"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
