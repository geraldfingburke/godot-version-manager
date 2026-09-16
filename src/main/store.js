const { app } = require('electron');
const path = require('path');
const fs = require('fs-extra');

class StoreManager {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.settingsFile = path.join(this.userDataPath, 'settings.json');
    this.installedFile = path.join(this.userDataPath, 'installed_versions.json');
    
    this.initDefaults();
  }

  initDefaults() {
    const defaultInstallsPath = path.join(this.userDataPath, 'installs');
    fs.ensureDirSync(defaultInstallsPath);

    if (!fs.existsSync(this.settingsFile)) {
      const defaultSettings = {
        defaultInstallDir: defaultInstallsPath,
        askEveryTime: false,
        autoCheckUpdates: true,
        githubToken: ''
      };
      fs.writeJsonSync(this.settingsFile, defaultSettings, { spaces: 2 });
    }

    if (!fs.existsSync(this.installedFile)) {
      fs.writeJsonSync(this.installedFile, [], { spaces: 2 });
    }
  }

  getSettings() {
    try {
      const settings = fs.readJsonSync(this.settingsFile);
      if (!settings.defaultInstallDir) {
        settings.defaultInstallDir = path.join(this.userDataPath, 'installs');
      }
      return settings;
    } catch (err) {
      console.error('Error reading settings:', err);
      return {
        defaultInstallDir: path.join(this.userDataPath, 'installs'),
        askEveryTime: false,
        autoCheckUpdates: true,
        githubToken: ''
      };
    }
  }

  saveSettings(newSettings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...newSettings };
      fs.ensureDirSync(updated.defaultInstallDir);
      fs.writeJsonSync(this.settingsFile, updated, { spaces: 2 });
      return updated;
    } catch (err) {
      console.error('Error saving settings:', err);
      throw err;
    }
  }

  getInstalledVersions() {
    try {
      const versions = fs.readJsonSync(this.installedFile);
      // Verify paths exist on disk
      const validVersions = versions.map(v => {
        const exists = fs.existsSync(v.executablePath);
        return { ...v, existsOnDisk: exists };
      });
      return validVersions;
    } catch (err) {
      console.error('Error reading installed versions:', err);
      return [];
    }
  }

  addInstalledVersion(versionData) {
    const versions = this.getInstalledVersions();
    // Check if already present by id or executablePath
    const existingIndex = versions.findIndex(v => v.id === versionData.id || v.executablePath === versionData.executablePath);
    if (existingIndex >= 0) {
      versions[existingIndex] = { ...versions[existingIndex], ...versionData, existsOnDisk: true };
    } else {
      versions.push({ ...versionData, existsOnDisk: true });
    }
    fs.writeJsonSync(this.installedFile, versions, { spaces: 2 });
    return versions;
  }

  removeInstalledVersion(id) {
    let versions = this.getInstalledVersions();
    versions = versions.filter(v => v.id !== id);
    fs.writeJsonSync(this.installedFile, versions, { spaces: 2 });
    return versions;
  }

  toggleFavorite(id) {
    const versions = this.getInstalledVersions();
    const version = versions.find(v => v.id === id);
    if (version) {
      version.isFavorite = !version.isFavorite;
      fs.writeJsonSync(this.installedFile, versions, { spaces: 2 });
    }
    return versions;
  }
}

module.exports = StoreManager;
