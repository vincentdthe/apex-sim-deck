# ApexLaunch Sim Deck 🏎️✈️

**ApexLaunch Sim Deck** is a modern, high-performance desktop launcher built specifically for sim racing and flight simulation setups. It provides automated multi-app launch chaining, VR vs. 2D display profile management, process collision prevention, and live system status tracking.

---

## 🛠️ Software & Hardware Preset Stack

Pre-configured specifically for your flight and racing hardware out of the box:

### ✈️ Flight Simulation Stack (Moza AB9 Base)
* **DCS World**:
  * **VR Mode**: Moza Cockpit, DCS-SRS, VoiceAttack, SimShaker for Aviators, OpenKneeboard *(TrackIR auto-disabled)*.
  * **2D Mode**: Moza Cockpit, NaturalPoint TrackIR 5, DCS-SRS, VoiceAttack, SimShaker for Aviators, OpenKneeboard.
* **Falcon BMS**:
  * **VR Mode**: Moza Cockpit, OpenKneeboard, FoxVox, SimShaker Wings *(TrackIR auto-disabled)*.
  * **2D Mode**: Moza Cockpit, NaturalPoint TrackIR 5, OpenKneeboard, FoxVox, SimShaker Wings.

### 🏎️ Sim Racing Stack (Fanatec Hardware)
* Fanatec FanaLab / Control Center, Overtake Track Titan, Garage 61 Agent, Bloops Telemetry Audio, Crew Chief V4, SimHub.

---

## 🌟 Core Features

### 1. 🎛️ Custom Profile Management
* **VR vs. 2D Display Modes**: Configure distinct launch pipelines for VR and 2D monitor sessions.
* **Auto-Launch Game Executable Toggle**: Each profile includes an option:
  * `[x] Automatically launch main game executable`
  * Uncheck if you want the profile to launch your background helper apps ONLY without starting the game executable.
* **Local & Web Image Banners**: Load custom game banner art directly from your local PC (`.png`, `.jpg`, `.webp`, `.bmp`) or via web URLs.

### 2. 🛠️ Utilities Tab (Manual App Launcher)
* Access a dedicated manual launch workspace to trigger hardware software (e.g. Moza Cockpit, TrackIR, SimHub) individually with a single click outside of a game profile.
* View real-time 🟢 **RUNNING** vs ⚪ **IDLE** status indicators powered by Windows process monitoring.

### 3. 🧠 Smart Execution & Process Protection
* **Already Running Detector**: Checks Windows active processes before launching. If an app or game is already active, it skips launching a duplicate instance and logs an informative status step.
* **Auto-Kill Companion Apps**: Option to automatically terminate companion apps when the main game exits.

---

## 💻 Developer Setup & Compiling Instructions

### 📋 Prerequisites & Dependencies
To run or compile this application on a development PC, you only need:
1. **Windows 10 or Windows 11** (64-bit)
2. **Node.js** (v18.0.0 or higher) — Download from [nodejs.org](https://nodejs.org)
3. **Git** for Windows — Download from [git-scm.com](https://git-scm.com)

*No other global compilers, Python, or C++ build toolchains are required!*

---

### 🔨 How to Build & Compile the Standalone `.exe`

#### Step 1: Clone the Repository & Install Dependencies
Open PowerShell or Command Prompt and run:
```powershell
# Clone your repository
git clone https://github.com/vincentdthe/apex-sim-deck.git
cd apex-sim-deck

# Install project dependencies
npm install
```

#### Step 2: Run in Development Mode (Optional)
To test the desktop app before building:
```powershell
npm run electron
```

#### Step 3: Compile Standalone Executable (.exe)
To package the app into a standalone Windows `.exe` application:
```powershell
npm run package
```

#### 📦 Output Executable Folder
Once compilation finishes, your standalone executable folder will be generated at:
```text
dist_app/ApexLaunch Sim Deck-win32-x64/ApexLaunch Sim Deck.exe
```

### 🚚 Distribution
Simply copy or zip the entire `ApexLaunch Sim Deck-win32-x64` directory. Users who receive this folder can double-click **`ApexLaunch Sim Deck.exe`** to run the app directly — **no Node.js or npm installation is required on end-user machines!**

---

## 📄 License
MIT License. Created for sim racers and flight sim enthusiasts.
