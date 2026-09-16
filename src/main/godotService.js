const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { shell, dialog, app } = require('electron');
const AdmZip = require('adm-zip');

class GodotService {
  constructor(storeManager) {
    this.store = storeManager;
    this.cachedReleases = null;
    this.cacheTime = 0;
  }

  detectSystemPlatform() {
    const platform = process.platform;
    const arch = process.arch;

    let osName = 'win64';
    if (platform === 'win32') {
      osName = arch === 'ia32' ? 'win32' : 'win64';
    } else if (platform === 'darwin') {
      osName = 'macos';
    } else if (platform === 'linux') {
      osName = arch === 'arm64' ? 'linux.arm64' : 'linux.x86_64';
    }
    return { platform, arch, osName };
  }

  async fetchReleases(forceRefresh = false) {
    const NOW = Date.now();
    if (!forceRefresh && this.cachedReleases && (NOW - this.cacheTime < 15 * 60 * 1000)) {
      return this.cachedReleases;
    }

    const settings = this.store.getSettings();
    const headers = {
      'User-Agent': 'Godot-Version-Manager',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (settings.githubToken) {
      headers['Authorization'] = `token ${settings.githubToken}`;
    }

    try {
      const response = await fetch('https://api.github.com/repos/godotengine/godot-builds/releases?per_page=50', { headers });
      
      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        console.warn(`godot-builds API returned ${response.status}, trying godot repo fallback...`);
        const fallbackRes = await fetch('https://api.github.com/repos/godotengine/godot/releases?per_page=50', { headers });
        if (!fallbackRes.ok) {
          throw new Error(`GitHub API error: ${fallbackRes.statusText}`);
        }
        data = await fallbackRes.json();
      }

      const processedReleases = this.parseGitHubReleases(data);
      this.cachedReleases = processedReleases;
      this.cacheTime = NOW;
      return processedReleases;
    } catch (err) {
      console.error('Failed to fetch releases:', err);
      if (this.cachedReleases) return this.cachedReleases;
      throw err;
    }
  }

  parseGitHubReleases(releases) {
    const { osName } = this.detectSystemPlatform();

    return releases.map(rel => {
      const tagName = rel.tag_name || rel.name;
      const isPrerelease = rel.prerelease || tagName.includes('dev') || tagName.includes('rc') || tagName.includes('alpha') || tagName.includes('beta');
      const isStable = !isPrerelease;
      const publishedAt = rel.published_at;

      const assets = rel.assets || [];
      const versionAssets = [];

      assets.forEach(asset => {
        const name = asset.name.toLowerCase();
        if (!name.endsWith('.zip') && !name.endsWith('.tar.xz')) return;

        let platform = 'unknown';
        if (name.includes('win64')) platform = 'win64';
        else if (name.includes('win32')) platform = 'win32';
        else if (name.includes('macos') || name.includes('osx')) platform = 'macos';
        else if (name.includes('linux.x86_64') || name.includes('linux_x86_64') || name.includes('x86_64')) platform = 'linux.x86_64';
        else if (name.includes('linux.arm64')) platform = 'linux.arm64';
        else if (name.includes('linux')) platform = 'linux';

        const isMono = name.includes('mono');

        versionAssets.push({
          id: asset.id,
          name: asset.name,
          downloadUrl: asset.browser_download_url,
          size: asset.size,
          platform,
          isMono,
          isCompatible: platform === osName || (osName === 'win64' && (platform === 'win64' || platform === 'win32'))
        });
      });

      return {
        id: rel.id,
        tagName,
        name: rel.name || tagName,
        body: rel.body,
        publishedAt,
        isPrerelease,
        isStable,
        htmlUrl: rel.html_url,
        assets: versionAssets
      };
    }).filter(rel => rel.assets.length > 0);
  }

  async selectDirectory() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Godot Installation Directory'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  }

  async selectExecutable() {
    const filters = process.platform === 'win32' 
      ? [{ name: 'Executables', extensions: ['exe'] }, { name: 'All Files', extensions: ['*'] }]
      : [{ name: 'All Files', extensions: ['*'] }];

    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select Godot Executable',
      filters
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  }

  async scanDirectoryForInstalls(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) return [];

    const discovered = [];
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const exePath = await this.findGodotExecutable(fullPath);
        if (exePath) {
          const cleanName = entry;
          const sizeBytes = await this.getFolderSize(fullPath);
          const versionData = {
            id: cleanName,
            name: this.formatVersionName(cleanName),
            versionTag: cleanName,
            isMono: cleanName.toLowerCase().includes('mono'),
            platform: cleanName.toLowerCase().includes('win64') ? 'win64' : process.platform,
            installPath: fullPath,
            executablePath: exePath,
            installedAt: new Date().toISOString(),
            sizeBytes,
            isFavorite: false,
            custom: false
          };
          this.store.addInstalledVersion(versionData);
          discovered.push(versionData);
        }
      }
    }

    return discovered;
  }

  async downloadAndInstall(asset, customTargetDir, createShortcutOption, shortcutAlias, onProgress) {
    const settings = this.store.getSettings();
    let targetParentDir = customTargetDir;

    if (!targetParentDir) {
      if (settings.askEveryTime) {
        targetParentDir = await this.selectDirectory();
        if (!targetParentDir) {
          throw new Error('Installation cancelled: No directory selected.');
        }
      } else {
        targetParentDir = settings.defaultInstallDir;
      }
    }

    fs.ensureDirSync(targetParentDir);

    const cleanName = asset.name.replace(/\.(zip|tar\.xz)$/i, '');
    const installPath = path.join(targetParentDir, cleanName);

    if (fs.existsSync(installPath)) {
      await fs.remove(installPath);
    }
    fs.ensureDirSync(installPath);

    const tempZipPath = path.join(installPath, `download_${Date.now()}.zip`);

    try {
      // 1. Download
      if (onProgress) onProgress({ phase: 'downloading', percent: 0, transferred: 0, total: asset.size });

      const response = await fetch(asset.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const totalBytes = parseInt(response.headers.get('content-length') || asset.size, 10);
      let downloadedBytes = 0;
      const fileStream = fs.createWriteStream(tempZipPath);

      const reader = response.body.getReader();
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        downloadedBytes += value.length;
        fileStream.write(Buffer.from(value));

        const elapsedTimeSec = (Date.now() - startTime) / 1000;
        const speedBps = elapsedTimeSec > 0 ? downloadedBytes / elapsedTimeSec : 0;
        const percent = totalBytes > 0 ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)) : 0;

        if (onProgress) {
          onProgress({
            phase: 'downloading',
            percent,
            transferred: downloadedBytes,
            total: totalBytes,
            speedBps
          });
        }
      }

      await new Promise((resolve, reject) => {
        fileStream.end();
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });

      // 2. Extract
      if (onProgress) onProgress({ phase: 'extracting', percent: 100 });

      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(installPath, true);

      await fs.remove(tempZipPath);

      // 3. Find Godot executable
      const exePath = await this.findGodotExecutable(installPath);
      if (!exePath) {
        throw new Error('Godot executable could not be found after extraction.');
      }

      const sizeBytes = await this.getFolderSize(installPath);
      const defaultName = this.formatVersionName(cleanName);

      // 4. Register installed version in store
      const versionData = {
        id: cleanName,
        name: defaultName,
        versionTag: cleanName,
        isMono: asset.isMono,
        platform: asset.platform,
        installPath,
        executablePath: exePath,
        installedAt: new Date().toISOString(),
        sizeBytes,
        isFavorite: false,
        custom: false,
        shortcutPath: null
      };

      // 5. Create Desktop Shortcut if requested (with optional alias)
      if (createShortcutOption) {
        const shortcutPath = await this.createDesktopShortcut(versionData, shortcutAlias);
        if (shortcutPath) {
          versionData.shortcutPath = shortcutPath;
        }
      }

      this.store.addInstalledVersion(versionData);

      if (onProgress) onProgress({ phase: 'complete', percent: 100 });

      return versionData;
    } catch (err) {
      if (fs.existsSync(installPath)) {
        await fs.remove(installPath).catch(() => {});
      }
      throw err;
    }
  }

  async createDesktopShortcut(versionData, alias) {
    if (process.platform === 'win32') {
      const desktopPath = app.getPath('desktop');
      const displayName = (alias && alias.trim()) ? alias.trim() : (versionData.name || versionData.id);
      const safeName = displayName.replace(/[/\\?%*:|"<>]/g, '_');
      const shortcutPath = path.join(desktopPath, `${safeName}.lnk`);

      shell.writeShortcutLink(shortcutPath, 'create', {
        target: versionData.executablePath,
        workingDirectory: path.dirname(versionData.executablePath),
        description: `Godot Engine - ${versionData.name}`
      });

      return shortcutPath;
    }
    return null;
  }

  async cleanupDesktopShortcut(version) {
    if (!version) return;
    try {
      const desktopPath = app.getPath('desktop');

      // 1. Direct saved shortcut path
      if (version.shortcutPath && fs.existsSync(version.shortcutPath)) {
        await fs.remove(version.shortcutPath);
      }

      // 2. Scan desktop for .lnk files targeting version.executablePath or matching name/id
      if (process.platform === 'win32') {
        const files = await fs.readdir(desktopPath);
        for (const file of files) {
          if (file.toLowerCase().endsWith('.lnk')) {
            const fullLnkPath = path.join(desktopPath, file);
            try {
              const details = shell.readShortcutLink(fullLnkPath);
              if (details && details.target && details.target.toLowerCase() === version.executablePath.toLowerCase()) {
                await fs.remove(fullLnkPath);
              }
            } catch (e) {
              // Ignore unreadable shortcut links
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error cleaning up shortcut:', err);
    }
  }

  async findGodotExecutable(dir) {
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    const files = await fs.readdir(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isFile()) {
        if (isWindows && file.toLowerCase().endsWith('.exe') && file.toLowerCase().includes('godot')) {
          return fullPath;
        } else if (!isWindows && !isMac && file.toLowerCase().includes('godot') && !file.endsWith('.zip')) {
          return fullPath;
        }
      } else if (stat.isDirectory()) {
        if (isMac && file.endsWith('.app')) {
          return path.join(fullPath, 'Contents', 'MacOS', 'Godot');
        }
        const subFiles = await fs.readdir(fullPath);
        for (const subFile of subFiles) {
          const subPath = path.join(fullPath, subFile);
          const subStat = await fs.stat(subPath);
          if (subStat.isFile()) {
            if (isWindows && subFile.toLowerCase().endsWith('.exe') && subFile.toLowerCase().includes('godot')) {
              return subPath;
            } else if (!isWindows && !isMac && subFile.toLowerCase().includes('godot')) {
              return subPath;
            }
          }
        }
      }
    }
    return null;
  }

  formatVersionName(raw) {
    let clean = raw.replace(/^Godot_v?/i, '');
    let isMono = false;
    if (clean.includes('mono')) {
      isMono = true;
      clean = clean.replace(/_mono/i, '');
    }
    const parts = clean.split('_');
    const ver = parts[0] || '';
    const plat = parts[1] || '';
    return `Godot ${ver} ${isMono ? 'Mono (.NET)' : ''} ${plat ? `(${plat})` : ''}`.trim();
  }

  async getFolderSize(dirPath) {
    try {
      let totalSize = 0;
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          totalSize += await this.getFolderSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
      return totalSize;
    } catch (e) {
      return 0;
    }
  }

  launchVersion(executablePath) {
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Executable not found at path: ${executablePath}`);
    }

    const workingDir = path.dirname(executablePath);
    const godotProcess = spawn(executablePath, [], {
      cwd: workingDir,
      detached: true,
      stdio: 'ignore'
    });

    godotProcess.unref();
    return true;
  }

  async openFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
      await shell.openPath(folderPath);
    } else {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }
  }

  async uninstallVersion(id) {
    const versions = this.store.getInstalledVersions();
    const version = versions.find(v => v.id === id);

    if (version) {
      // Clean up desktop shortcut if present
      await this.cleanupDesktopShortcut(version);

      if (fs.existsSync(version.installPath)) {
        await fs.remove(version.installPath);
      }
      this.store.removeInstalledVersion(id);
    }
    return this.store.getInstalledVersions();
  }

  async addCustomVersion(exePath) {
    if (!exePath || !fs.existsSync(exePath)) {
      throw new Error('Invalid executable file path.');
    }

    const filename = path.basename(exePath);
    const installPath = path.dirname(exePath);
    const id = `custom-${Date.now()}`;
    const name = `Custom - ${filename}`;
    const sizeBytes = await this.getFolderSize(installPath);

    const versionData = {
      id,
      name,
      versionTag: 'Custom',
      isMono: filename.toLowerCase().includes('mono'),
      platform: process.platform,
      installPath,
      executablePath: exePath,
      installedAt: new Date().toISOString(),
      sizeBytes,
      isFavorite: false,
      custom: true
    };

    this.store.addInstalledVersion(versionData);
    return versionData;
  }
}

module.exports = GodotService;
