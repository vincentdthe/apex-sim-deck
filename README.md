# ApexLaunch Sim Deck 🏎️✈️

**ApexLaunch Sim Deck** is a modern, high-performance desktop launcher built specifically for sim racing and flight simulation enthusiasts. It provides automated multi-app launch chaining, VR vs. 2D display profile management, process collision prevention, and live system status tracking.

---

## 🌟 Key Features

### 1. 🏎️ Sim Racing & ✈️ Flight Simulation Hubs
* **Dedicated Workspaces**: Separate tabs for Sim Racing (iRacing, Le Mans Ultimate, ACC) and Flight Simulation (DCS World, Falcon BMS).
* **Multi-Profile System**: Build custom launch profiles per simulator (e.g. *DCS VR*, *DCS 2D*, *BMS VR*, *BMS 2D*, *iRacing VR*, *iRacing 2D*).
* **Local & Web Image Banners**: Load custom game banner art directly from your local PC (`.png`, `.jpg`, `.webp`, `.bmp`) or via web URLs.

### 2. 🎛️ Tailored Companion App Chaining
Pre-configured for popular flight and racing software suites out of the box:

* **DCS World Setup**:
  * **VR Mode**: Moza Cockpit, DCS-SRS, VoiceAttack, SimShaker for Aviators, OpenKneeboard *(TrackIR auto-disabled)*.
  * **2D Mode**: Moza Cockpit, TrackIR 5, DCS-SRS, VoiceAttack, SimShaker for Aviators, OpenKneeboard.
* **Falcon BMS Setup**:
  * **VR Mode**: Moza Cockpit, OpenKneeboard, FoxVox, SimShaker Wings *(TrackIR auto-disabled)*.
  * **2D Mode**: Moza Cockpit, TrackIR 5, OpenKneeboard, FoxVox, SimShaker Wings.
* **Racing Setup**:
  * Fanatec FanaLab, Overtake Track Titan, Garage 61 Agent, Bloops Telemetry Audio, Crew Chief V4, SimHub.

### 3. 🛠️ Utilities Tab (Manual App Launcher)
* Access a dedicated manual launch workspace to trigger hardware software (e.g. Moza Cockpit, TrackIR, SimHub) individually with a single click outside of a game profile.
* View real-time 🟢 **RUNNING** vs ⚪ **IDLE** status indicators powered by Windows process monitoring.

### 4. 🧠 Smart Execution & Process Protection
* **Already Running Detector**: Checks Windows active processes before launching. If an app or game is already active, it skips launching a duplicate instance and logs an informative status step.
* **Auto-Launch Game Executable Toggle**: Each profile includes a setting:
  * `[x] Automatically launch main game executable`
  * Uncheck if you want the profile to launch your background helper apps ONLY without starting the game executable.
* **Auto-Kill Companion Apps**: Option to automatically terminate companion apps when the main game exits.

---

## 🛠️ Usage & Setup Guide

### 1. Settings Tab (App Library)
1. Go to the **Settings Tab** in the top navigation.
2. Click **Browse** next to any app to set the exact `.exe` location on your hard drive.
3. Assign categories (`[x] Racing`, `[x] Flight`, or `[x] Both`).
4. Set optional default launch parameters and execution delays (in seconds).

### 2. Creating / Customizing Profiles
1. Navigate to **Racing** or **Flight** tabs.
2. Click the **Gear icon** on any profile to open the Profile Builder.
3. Choose **VR Mode** or **2D Monitor** mode.
4. Select which companion apps to trigger from the checklist.
5. Set your game `.exe` path, launch flags (e.g. `--force_enable_VR`, `-vr`), and toggle whether to auto-launch the main game executable.

### 3. Launching
Click **LAUNCH** on any profile to trigger the automated sequential pipeline. Watch the live **Launch Console Drawer** for step-by-step progress and PID tracking.

---

## 🚀 Running & Building

### Prerequisites
* Windows 10 / 11
* Node.js (v18+)

### Development Mode
```powershell
# Install dependencies
npm install

# Run application in Electron desktop mode
npm run electron

# Or run frontend dev server in web browser
npm run dev
```

### Packaging Standalone Executable (.exe)
```powershell
npm run package
```
This generates a standalone folder containing `ApexLaunch Sim Deck.exe` under:
`dist_app/ApexLaunch Sim Deck-win32-x64/`

You can move or share this folder anywhere on Windows without needing Node.js or npm installed!

---

## 📄 License
MIT License. Created for sim racers and flight sim enthusiasts.
