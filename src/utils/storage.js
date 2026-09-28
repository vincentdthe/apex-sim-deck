import { INITIAL_APPS, INITIAL_GAMES } from '../data/initialData';

const APPS_KEYS = [
  'apex_sim_deck_apps_v10',
  'apex_sim_deck_apps_v9',
  'apex_sim_deck_apps_v8',
  'apex_sim_deck_apps_v7',
  'apex_sim_deck_apps_v6',
  'apex_sim_deck_apps_v5',
  'apex_sim_deck_apps'
];

const GAMES_KEYS = [
  'apex_sim_deck_games_v10',
  'apex_sim_deck_games_v9',
  'apex_sim_deck_games_v8',
  'apex_sim_deck_games_v7',
  'apex_sim_deck_games_v6',
  'apex_sim_deck_games_v5',
  'apex_sim_deck_games'
];

const PRIMARY_APPS_KEY = APPS_KEYS[0];
const PRIMARY_GAMES_KEY = GAMES_KEYS[0];

export function loadApps() {
  try {
    // 1. Check all keys from newest to oldest for existing user configurations
    for (const key of APPS_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Found existing user data - always preserve it and update primary key
            localStorage.setItem(PRIMARY_APPS_KEY, JSON.stringify(parsed));
            return parsed;
          }
        } catch (e) {
          console.warn(`Failed to parse apps from key ${key}`, e);
        }
      }
    }

    // 2. Only if no saved user data exists anywhere, initialize with defaults
    localStorage.setItem(PRIMARY_APPS_KEY, JSON.stringify(INITIAL_APPS));
    return INITIAL_APPS;
  } catch (e) {
    console.error('Failed to load apps from storage:', e);
    return INITIAL_APPS;
  }
}

export function saveApps(apps) {
  try {
    if (Array.isArray(apps)) {
      localStorage.setItem(PRIMARY_APPS_KEY, JSON.stringify(apps));
    }
  } catch (e) {
    console.error('Failed to save apps to storage:', e);
  }
}

export function loadGames() {
  try {
    // 1. Check all keys from newest to oldest for existing user configurations
    for (const key of GAMES_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure sessionProcesses property exists on games without mutating any user settings
            const enriched = parsed.map((game) => {
              const defaultGame = INITIAL_GAMES.find((ig) => ig.id === game.id);
              return {
                ...game,
                sessionProcesses: Array.isArray(game.sessionProcesses)
                  ? game.sessionProcesses
                  : defaultGame?.sessionProcesses || []
              };
            });

            localStorage.setItem(PRIMARY_GAMES_KEY, JSON.stringify(enriched));
            return enriched;
          }
        } catch (e) {
          console.warn(`Failed to parse games from key ${key}`, e);
        }
      }
    }

    // 2. Only if no saved user data exists anywhere, initialize with defaults
    localStorage.setItem(PRIMARY_GAMES_KEY, JSON.stringify(INITIAL_GAMES));
    return INITIAL_GAMES;
  } catch (e) {
    console.error('Failed to load games from storage:', e);
    return INITIAL_GAMES;
  }
}

export function saveGames(games) {
  try {
    if (Array.isArray(games)) {
      localStorage.setItem(PRIMARY_GAMES_KEY, JSON.stringify(games));
    }
  } catch (e) {
    console.error('Failed to save games to storage:', e);
  }
}

export function exportConfig(apps, games) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ apps, games }, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `apex_sim_deck_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetToDefaults() {
  localStorage.setItem(PRIMARY_APPS_KEY, JSON.stringify(INITIAL_APPS));
  localStorage.setItem(PRIMARY_GAMES_KEY, JSON.stringify(INITIAL_GAMES));
  return { apps: INITIAL_APPS, games: INITIAL_GAMES };
}
