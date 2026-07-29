export const INITIAL_APPS = [
  // --- RACING APPS ---
  {
    id: 'app-fanatec',
    name: 'Fanatec FanaLab / Control Center',
    exePath: 'C:\\Program Files\\Fanatec\\FanaLab\\FanaLab.exe',
    args: '-minimized',
    delay: 0,
    autoKill: true,
    categories: { racing: true, flight: false }
  },
  {
    id: 'app-track-titan',
    name: 'Overtake Track Titan App',
    exePath: 'C:\\Users\\Public\\TrackTitan\\TrackTitan.exe',
    args: '',
    delay: 2,
    autoKill: true,
    categories: { racing: true, flight: false }
  },
  {
    id: 'app-garage61',
    name: 'Garage 61 Agent',
    exePath: 'C:\\Program Files\\Garage61\\g61-agent.exe',
    args: '--background',
    delay: 1,
    autoKill: true,
    categories: { racing: true, flight: false }
  },
  {
    id: 'app-bloops',
    name: 'Bloops Telemetry Audio',
    exePath: 'C:\\SimTools\\Bloops\\Bloops.exe',
    args: '',
    delay: 1,
    autoKill: true,
    categories: { racing: true, flight: false }
  },
  {
    id: 'app-crewchief',
    name: 'Crew Chief V4',
    exePath: 'C:\\Program Files (x86)\\Britton IT Ltd\\Crew Chief V4\\CrewChiefV4.exe',
    args: '-iracing',
    delay: 2,
    autoKill: true,
    categories: { racing: true, flight: false }
  },
  {
    id: 'app-simhub',
    name: 'SimHub Dash & Motion',
    exePath: 'C:\\Program Files (x86)\\SimHub\\SimHubWPF.exe',
    args: '-silent',
    delay: 0,
    autoKill: false,
    categories: { racing: true, flight: false }
  },

  // --- SHARED / HARDWARE APPS ---
  {
    id: 'app-moza-flight',
    name: 'Moza Flight Software / Pit House',
    exePath: 'C:\\Program Files\\MOZA Pit House\\MOZAPitHouse.exe',
    args: '-minimized',
    delay: 0,
    autoKill: false,
    categories: { racing: true, flight: true }
  },
  {
    id: 'app-trackir',
    name: 'NaturalPoint TrackIR 5',
    exePath: 'C:\\Program Files (x86)\\NaturalPoint\\TrackIR5\\TrackIR5.exe',
    args: '-minimized',
    delay: 1,
    autoKill: true,
    categories: { racing: true, flight: true }
  },

  // --- FLIGHT SIM SPECIFIC APPS ---
  {
    id: 'app-srs',
    name: 'DCS Simple Radio Standalone (SRS)',
    exePath: 'C:\\Program Files\\DCS-SRS\\SR-ClientRadio.exe',
    args: '',
    delay: 1,
    autoKill: true,
    categories: { racing: false, flight: true }
  },
  {
    id: 'app-voice-attack',
    name: 'VoiceAttack',
    exePath: 'C:\\Program Files (x86)\\VoiceAttack\\VoiceAttack.exe',
    args: '-minimized',
    delay: 1,
    autoKill: true,
    categories: { racing: false, flight: true }
  },
  {
    id: 'app-simshaker-aviators',
    name: 'SimShaker for Aviators',
    exePath: 'C:\\Program Files (x86)\\SimShaker for Aviators\\SimShaker for Aviators.exe',
    args: '',
    delay: 1,
    autoKill: true,
    categories: { racing: false, flight: true }
  },
  {
    id: 'app-openkneeboard',
    name: 'OpenKneeboard',
    exePath: 'C:\\Program Files\\OpenKneeboard\\bin\\OpenKneeboardApp.exe',
    args: '',
    delay: 1,
    autoKill: true,
    categories: { racing: false, flight: true }
  },
  {
    id: 'app-foxvox',
    name: 'FoxVox',
    exePath: 'C:\\FlightTools\\FoxVox\\FoxVox.exe',
    args: '',
    delay: 1,
    autoKill: true,
    categories: { racing: false, flight: true }
  },
  {
    id: 'app-simshaker-wings',
    name: 'SimShaker Wings',
    exePath: 'C:\\Program Files (x86)\\SimShaker Wings\\SimShaker Wings.exe',
    args: '',
    delay: 1,
    autoKill: true,
    categories: { racing: false, flight: true }
  }
];

export const INITIAL_GAMES = [
  // --- RACING SIMS ---
  {
    id: 'game-iracing',
    name: 'iRacing',
    category: 'racing',
    banner: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    description: 'Premier online motorsport simulation platform.',
    profiles: [
      {
        id: 'prof-iracing-vr',
        name: 'iRacing VR Mode',
        isVr: true,
        exePath: 'C:\\Program Files (x86)\\iRacing\\ui\\iRacingSim64DX11.exe',
        args: '-vr -openxr',
        enabledAppIds: ['app-fanatec', 'app-track-titan', 'app-garage61', 'app-bloops', 'app-crewchief'],
        appOverrides: {
          'app-crewchief': { args: '-iracing' }
        }
      },
      {
        id: 'prof-iracing-2d',
        name: 'iRacing 2D Mode',
        isVr: false,
        exePath: 'C:\\Program Files (x86)\\iRacing\\ui\\iRacingSim64DX11.exe',
        args: '-dx11',
        enabledAppIds: ['app-fanatec', 'app-track-titan', 'app-garage61', 'app-crewchief', 'app-trackir'],
        appOverrides: {}
      }
    ]
  },
  {
    id: 'game-lmu',
    name: 'Le Mans Ultimate',
    category: 'racing',
    banner: 'https://images.unsplash.com/photo-1541348263662-e068662d82af?auto=format&fit=crop&w=800&q=80',
    description: 'Official game of the FIA World Endurance Championship & 24h Le Mans.',
    profiles: [
      {
        id: 'prof-lmu-vr',
        name: 'LMU VR Mode',
        isVr: true,
        exePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Le Mans Ultimate\\Le Mans Ultimate.exe',
        args: '-vr',
        enabledAppIds: ['app-fanatec', 'app-track-titan', 'app-crewchief'],
        appOverrides: {
          'app-crewchief': { args: '-rf2' }
        }
      },
      {
        id: 'prof-lmu-2d',
        name: 'LMU 2D Mode',
        isVr: false,
        exePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Le Mans Ultimate\\Le Mans Ultimate.exe',
        args: '',
        enabledAppIds: ['app-fanatec', 'app-track-titan', 'app-crewchief', 'app-trackir'],
        appOverrides: {}
      }
    ]
  },

  // --- FLIGHT SIMS ---
  {
    id: 'game-dcs',
    name: 'DCS World',
    category: 'flight',
    banner: 'https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=800&q=80',
    description: 'Digital Combat Simulator: High fidelity combat aviation.',
    profiles: [
      {
        id: 'prof-dcs-vr',
        name: 'DCS VR Mode',
        isVr: true,
        exePath: 'C:\\Program Files\\Eagle Dynamics\\DCS World OpenBeta\\bin\\DCS.exe',
        args: '--force_enable_VR',
        // Moza Flight, SRS, Voice Attack, Simshaker for Aviators, Openkneeboard (TrackIR disabled in VR)
        enabledAppIds: ['app-moza-flight', 'app-srs', 'app-voice-attack', 'app-simshaker-aviators', 'app-openkneeboard'],
        appOverrides: {}
      },
      {
        id: 'prof-dcs-2d',
        name: 'DCS 2D Mode',
        isVr: false,
        exePath: 'C:\\Program Files\\Eagle Dynamics\\DCS World OpenBeta\\bin\\DCS.exe',
        args: '--force_disable_VR',
        // Moza Flight, TrackIR, SRS, Voice Attack, Simshaker for Aviators, Openkneeboard
        enabledAppIds: ['app-moza-flight', 'app-trackir', 'app-srs', 'app-voice-attack', 'app-simshaker-aviators', 'app-openkneeboard'],
        appOverrides: {}
      }
    ]
  },
  {
    id: 'game-bms',
    name: 'Falcon BMS',
    category: 'flight',
    banner: 'https://images.unsplash.com/photo-1508672019048-805479767384?auto=format&fit=crop&w=800&q=80',
    description: 'Falcon Benchmark Sim: Premier F-16 combat simulation.',
    profiles: [
      {
        id: 'prof-bms-vr',
        name: 'BMS VR Mode',
        isVr: true,
        exePath: 'C:\\Falcon BMS 4.37\\Launcher.exe',
        args: '-vr',
        // Moza Flight, OpenKneeboard, FoxVox, Simshaker Wings (TrackIR disabled in VR)
        enabledAppIds: ['app-moza-flight', 'app-openkneeboard', 'app-foxvox', 'app-simshaker-wings'],
        appOverrides: {}
      },
      {
        id: 'prof-bms-2d',
        name: 'BMS 2D Mode',
        isVr: false,
        exePath: 'C:\\Falcon BMS 4.37\\Launcher.exe',
        args: '',
        // Moza Flight, TrackIR, OpenKneeboard, FoxVox, Simshaker Wings
        enabledAppIds: ['app-moza-flight', 'app-trackir', 'app-openkneeboard', 'app-foxvox', 'app-simshaker-wings'],
        appOverrides: {}
      }
    ]
  }
];
