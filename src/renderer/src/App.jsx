import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import InstalledGrid from './components/InstalledGrid';
import AvailableReleases from './components/AvailableReleases';
import Settings from './components/Settings';
import DownloadModal from './components/DownloadModal';
import { Monitor, CheckSquare, Square } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('installed');
  const [settings, setSettings] = useState(null);
  const [installedVersions, setInstalledVersions] = useState([]);
  const [releases, setReleases] = useState([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesError, setReleasesError] = useState(null);

  // Active Download State
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadingAsset, setDownloadingAsset] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Shortcut prompt modal state prior to download
  const [shortcutPromptAsset, setShortcutPromptAsset] = useState(null);
  const [wantShortcut, setWantShortcut] = useState(true);
  const [shortcutAlias, setShortcutAlias] = useState('');

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSettings = async () => {
    try {
      if (window.api) {
        const data = await window.api.getSettings();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const loadInstalledVersions = async () => {
    try {
      if (window.api) {
        const versions = await window.api.getInstalled();
        setInstalledVersions(versions);
      }
    } catch (err) {
      console.error('Failed to load installed versions:', err);
    }
  };

  const loadReleases = async (forceRefresh = false) => {
    setReleasesLoading(true);
    setReleasesError(null);
    try {
      if (window.api) {
        const data = await window.api.getReleases(forceRefresh);
        setReleases(data);
      }
    } catch (err) {
      console.error('Failed to load releases:', err);
      setReleasesError(err.message || 'Failed to connect to GitHub API');
    } finally {
      setReleasesLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadInstalledVersions();
    loadReleases(false);

    if (window.api) {
      const cleanup = window.api.onDownloadProgress((data) => {
        setDownloadProgress(data);
      });
      return cleanup;
    }
  }, []);

  const handleSaveSettings = async (newSettings) => {
    try {
      const result = await window.api.saveSettings(newSettings);
      setSettings(result.settings);
      
      if (result.discoveredCount > 0) {
        await loadInstalledVersions();
        showToast(`Settings saved. Discovered ${result.discoveredCount} existing Godot build(s)!`, 'success');
      } else {
        showToast('Settings saved successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleSelectDir = async () => {
    if (window.api) {
      const result = await window.api.selectDirectory();
      if (result) {
        if (result.discoveredCount > 0) {
          await loadInstalledVersions();
          showToast(`Selected directory & discovered ${result.discoveredCount} existing Godot build(s)!`, 'success');
        }
        return result.path;
      }
    }
    return null;
  };

  const handleLaunch = async (exePath) => {
    try {
      await window.api.launchVersion(exePath);
      showToast('Launching Godot Engine...', 'info');
    } catch (err) {
      showToast(`Launch failed: ${err.message}`, 'error');
    }
  };

  const handleOpenFolder = async (folderPath) => {
    try {
      await window.api.openFolder(folderPath);
    } catch (err) {
      showToast(`Could not open folder: ${err.message}`, 'error');
    }
  };

  const handleUninstall = async (id) => {
    try {
      const updated = await window.api.uninstallVersion(id);
      setInstalledVersions(updated);
      showToast('Godot version and associated desktop shortcuts uninstalled', 'success');
    } catch (err) {
      showToast(`Uninstall failed: ${err.message}`, 'error');
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const updated = await window.api.toggleFavorite(id);
      setInstalledVersions(updated);
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  const handleImportCustom = async () => {
    try {
      const version = await window.api.addCustomVersion();
      if (version) {
        await loadInstalledVersions();
        setCurrentTab('installed');
        showToast('Custom Godot executable registered', 'success');
      }
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    }
  };

  // Trigger prompt before installing asset
  const handleInstallAssetPrompt = (asset) => {
    const cleanName = asset.name.replace(/\.(zip|tar\.xz)$/i, '').replace(/^Godot_v?/i, 'Godot ');
    setShortcutPromptAsset(asset);
    setWantShortcut(true);
    setShortcutAlias(cleanName);
  };

  const confirmAndStartDownload = async () => {
    const asset = shortcutPromptAsset;
    const createShortcutOption = wantShortcut;
    const alias = shortcutAlias;

    setShortcutPromptAsset(null);

    setDownloadingAsset(asset);
    setDownloadProgress({ phase: 'downloading', percent: 0 });
    setDownloadError(null);

    let customTargetDir = null;

    if (settings?.askEveryTime) {
      const selected = await window.api.selectDirectory();
      if (!selected) {
        setDownloadingAsset(null);
        setDownloadProgress(null);
        return;
      }
      customTargetDir = selected.path || selected;
    }

    try {
      await window.api.startDownload(asset, customTargetDir, createShortcutOption, alias);
      await loadInstalledVersions();
      if (createShortcutOption) {
        showToast('Build installed & Desktop shortcut created!', 'success');
      } else {
        showToast('Build installed successfully!', 'success');
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadError(err.message || 'Download or extraction failed.');
    }
  };

  const handleCloseDownloadModal = () => {
    setDownloadingAsset(null);
    setDownloadProgress(null);
    setDownloadError(null);
  };

  return (
    <div className="flex h-screen w-screen bg-godot-dark overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        installedCount={installedVersions.length}
        onImportCustom={handleImportCustom}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentTab === 'installed' && (
          <InstalledGrid
            installedVersions={installedVersions}
            onLaunch={handleLaunch}
            onOpenFolder={handleOpenFolder}
            onUninstall={handleUninstall}
            onToggleFavorite={handleToggleFavorite}
            onNavigateToReleases={() => setCurrentTab('releases')}
          />
        )}

        {currentTab === 'releases' && (
          <AvailableReleases
            installedVersions={installedVersions}
            onInstallAsset={handleInstallAssetPrompt}
            onRefresh={() => loadReleases(true)}
            releases={releases}
            loading={releasesLoading}
            error={releasesError}
          />
        )}

        {currentTab === 'settings' && (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onSelectDir={handleSelectDir}
          />
        )}
      </main>

      {/* Desktop Shortcut Confirmation & Alias Prompt Dialog */}
      {shortcutPromptAsset && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-godot-card border border-godot-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-godot-blue/20 text-godot-blue flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">Install Build Options</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{shortcutPromptAsset.name}</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Checkbox for creating shortcut */}
              <div
                onClick={() => setWantShortcut(!wantShortcut)}
                className="flex items-center space-x-2.5 cursor-pointer text-xs text-gray-200"
              >
                {wantShortcut ? (
                  <CheckSquare className="w-4 h-4 text-godot-blue shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                <span className="font-semibold">Create a Desktop shortcut</span>
              </div>

              {/* Alias input field if shortcut is checked */}
              {wantShortcut && (
                <div className="pl-6 space-y-1.5 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-gray-300">
                    Shortcut Alias / Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={shortcutAlias}
                    onChange={(e) => setShortcutAlias(e.target.value)}
                    placeholder="Custom Shortcut Name"
                    className="w-full bg-godot-sidebar border border-godot-border text-xs rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-godot-blue"
                  />
                  <p className="text-[10px] text-gray-400">
                    Specify a custom alias for the desktop shortcut, or leave as default.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-godot-border/60">
              <button
                onClick={() => setShortcutPromptAsset(null)}
                className="px-4 py-2 bg-godot-sidebar hover:bg-godot-border text-gray-400 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-godot-border"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndStartDownload}
                className="px-4 py-2 bg-godot-blue hover:bg-godot-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-godot-blue/20"
              >
                Start Installation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal overlay */}
      {(downloadingAsset || downloadError) && (
        <DownloadModal
          progress={downloadProgress}
          asset={downloadingAsset}
          error={downloadError}
          onClose={handleCloseDownloadModal}
        />
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xl border z-50 transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-red-950 border-red-500/50 text-red-200'
              : toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
              : 'bg-godot-card border-godot-blue/60 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
