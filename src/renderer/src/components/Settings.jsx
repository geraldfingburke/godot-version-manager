import React, { useState, useEffect } from 'react';
import { Folder, Key, ToggleLeft, ToggleRight, Save, Check, RefreshCw, HardDrive, HelpCircle } from 'lucide-react';

export default function Settings({ settings, onSaveSettings, onSelectDir }) {
  const [defaultDir, setDefaultDir] = useState(settings?.defaultInstallDir || '');
  const [askEveryTime, setAskEveryTime] = useState(settings?.askEveryTime || false);
  const [githubToken, setGithubToken] = useState(settings?.githubToken || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setDefaultDir(settings.defaultInstallDir || '');
      setAskEveryTime(settings.askEveryTime || false);
      setGithubToken(settings.githubToken || '');
    }
  }, [settings]);

  const handleBrowseDir = async () => {
    const selected = await onSelectDir();
    if (selected) {
      setDefaultDir(selected);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      defaultInstallDir: defaultDir,
      askEveryTime,
      githubToken
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-godot-dark">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-godot-border">
        <h2 className="text-xl font-bold text-white tracking-wide">Settings & Preferences</h2>
        <p className="text-xs text-gray-400 mt-1">Configure default paths and installation behavior</p>
      </div>

      {/* Main Settings Form */}
      <div className="flex-1 p-6 overflow-y-auto max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Installation Directory */}
          <div className="bg-godot-card border border-godot-border rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <HardDrive className="w-4 h-4 text-godot-blue" />
              <span>Installation Directory Settings</span>
            </div>

            {/* Default Install Dir input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Default Install Directory
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={defaultDir}
                  onChange={(e) => setDefaultDir(e.target.value)}
                  className="flex-1 bg-godot-sidebar border border-godot-border text-xs rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-godot-blue"
                />
                <button
                  type="button"
                  onClick={handleBrowseDir}
                  className="px-3.5 py-2 bg-godot-sidebar hover:bg-godot-border text-gray-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-godot-border transition-colors shrink-0"
                >
                  <Folder className="w-4 h-4 text-godot-blue" />
                  <span>Browse</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Downloaded Godot versions will be extracted and saved inside this folder by default.
              </p>
            </div>

            {/* Ask Every Time Option */}
            <div className="pt-3 border-t border-godot-border/60 flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white block">
                  Ask every time for install directory
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  When enabled, a folder dialog will pop up every time you click "Install" to choose a target folder.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAskEveryTime(!askEveryTime)}
                className="text-godot-blue hover:text-godot-hover transition-colors p-1"
              >
                {askEveryTime ? (
                  <ToggleRight className="w-9 h-9 text-godot-blue" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Section 2: GitHub API Settings */}
          <div className="bg-godot-card border border-godot-border rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Key className="w-4 h-4 text-godot-blue" />
              <span>GitHub API Configuration (Optional)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Personal Access Token (PAT)
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-godot-sidebar border border-godot-border text-xs rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-godot-blue placeholder-gray-600"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                If you encounter GitHub API rate-limit errors when browsing releases, enter a GitHub PAT here.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-godot-blue hover:bg-godot-hover text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-godot-blue/20 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>

            {savedSuccess && (
              <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1 animate-fade-in">
                <Check className="w-4 h-4" />
                <span>Settings saved successfully!</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
