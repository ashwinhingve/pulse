# Desktop Development Setup (Tauri)

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Rust | 1.70+ | [rustup.rs](https://rustup.rs) |
| Visual Studio Build Tools | 2022 | [visualstudio.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Windows) |
| Xcode | 14+ | App Store (macOS) |
| WebView2 | Latest | Pre-installed on Windows 10/11 |

## First-Time Setup

### Windows

1. **Install Rust:**
   ```powershell
   winget install Rustlang.Rustup
   # Or download from https://rustup.rs
   ```

2. **Install Visual Studio Build Tools:**
   - Download from Microsoft
   - Select "Desktop development with C++"

3. **Verify:**
   ```powershell
   rustc --version    # Should show 1.70+
   cargo --version
   ```

### macOS

1. **Install Xcode CLI tools:**
   ```bash
   xcode-select --install
   ```

2. **Install Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### Both Platforms

```bash
cd frontend
npm install
```

## Development

```bash
# Start Tauri dev mode (hot-reload)
npm run desktop:dev
```

This will:
1. Start the Next.js dev server
2. Open a native Tauri window pointing to `localhost:3000`
3. Auto-reload on file changes

> **Note:** DevTools auto-open in debug mode. Close with F12.

## Production Build

### Windows (.exe / .msi)

```bash
npm run desktop:build
```

Output:
- NSIS: `src-tauri/target/release/bundle/nsis/PulseLogic_1.0.0_x64-setup.exe`
- MSI: `src-tauri/target/release/bundle/msi/PulseLogic_1.0.0_x64_en-US.msi`

### macOS (.dmg)

```bash
npm run desktop:build
```

Output: `src-tauri/target/release/bundle/dmg/PulseLogic_1.0.0_aarch64.dmg`

> **Note:** Code signing requires Apple Developer Program. Set `signingIdentity` in `tauri.conf.json`.

## Auto-Updater

The app checks for updates from a configurable endpoint. To enable:

1. Generate signing keys:
   ```bash
   npx tauri signer generate -w ~/.tauri/pulselogic.key
   ```

2. Set the public key in `tauri.conf.json` → `plugins.updater.pubkey`

3. Set the endpoint URL to your release server

## Architecture

```
src-tauri/
├── Cargo.toml          # Rust dependencies
├── tauri.conf.json     # App config, window, bundle, plugins
├── build.rs            # Build script
├── icons/              # App icons (ico, icns, png)
└── src/
    └── main.rs         # Rust entry point + custom commands
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `cargo build` fails | Run `rustup update` |
| Missing MSVC | Install VS Build Tools with C++ workload |
| WebView2 not found | Install from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) |
| Window blank | Check CSP in `tauri.conf.json` allows your API URLs |
| macOS signing fails | Verify `signingIdentity` and Xcode setup |
