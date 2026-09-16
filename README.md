# Godot Version Manager

An Electron desktop application for downloading, managing, and launching multiple versions of the [Godot Engine](https://godotengine.org).

<p align="center">
  <img src="cascading_logo.svg" alt="Godot Version Manager Logo" width="160" />
</p>

---

## ⬇️ Downloads & Latest Releases

Get the latest stable release for Windows:

| Package Type | Description | Download Link |
| :--- | :--- | :--- |
| **Installer** | Full Windows NSIS installer (`.exe`) with Start Menu & Desktop shortcuts | [📥 Download Installer](https://github.com/geraldfingburke/godot-version-manager/releases/latest/download/Godot%20Version%20Manager%20-%20Installer.exe) |
| **Portable** | Standalone portable executable (`.exe`) with no installation required | [📥 Download Portable](https://github.com/geraldfingburke/godot-version-manager/releases/latest/download/Godot%20Version%20Manager%20-%20Portable.exe) |

> 📌 **View all releases & changelogs**: [GitHub Releases Page](https://github.com/geraldfingburke/godot-version-manager/releases/latest)

---

## ✨ Features

- 📁 **Configurable Installation Directory**: Set a default folder for your Godot engines or choose custom paths.
- ❓ **Ask Every Time Option**: Enable a setting to prompt for installation location before every download.
- 🚀 **Install & Uninstall Any Release**: Download official Godot releases (Standard or Mono .NET builds) directly from GitHub with real-time download speed and zip extraction progress tracking.
- 🖥️ **Target Platform Filters**: Filter releases by target operating system (Windows, macOS, Linux).
- 🏷️ **Desktop Shortcut Creation & Custom Aliases**: Option to automatically create Desktop shortcuts when installing a build, with support for custom alias names (e.g. `Godot 4.3 - Main Project`).
- 🧹 **Automatic Shortcut Cleanup**: Cleanly removes associated desktop shortcuts when uninstalling a Godot version.
- 🔍 **Auto-Scan Existing Builds**: Automatically scans newly selected installation folders for existing Godot binaries and registers them.
- 🎛️ **Grid Management View**: Clean, card-based interface with one-click **Launch**, **Open Folder**, **Favorite**, and **Uninstall** actions.

---

## 💻 Development Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v20 or v22 recommended)
- `npm`

### Installation & Execution

1. Clone the repository:
   ```bash
   git clone https://github.com/geraldfingburke/godot-version-manager.git
   cd godot-version-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Package desktop executables locally:
   ```bash
   npm run package
   ```
   Built executables will be generated inside the `release/` directory.

---

## 🤖 CI/CD Release Pipeline

Pushing any release tag (e.g. `v1.0.0`) automatically triggers the GitHub Actions workflow (`.github/workflows/release.yml`) which:
1. Builds the Vite production bundle and runs `electron-builder`.
2. Packages clean installer and portable executables.
3. Automatically publishes a GitHub Release containing both `Godot Version Manager - Installer.exe` and `Godot Version Manager - Portable.exe`.

---

## ⚖️ Trademark & License

- **Godot Engine** is a registered trademark of the Godot Engine project.
- This version manager application is built under the [Godot Engine Brand Guidelines](https://godotengine.org/brand).
- Licensed under the [MIT License](LICENSE).
