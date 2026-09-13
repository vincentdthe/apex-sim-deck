import { INITIAL_APPS, INITIAL_GAMES } from '../data/initialData';

const PRIMARY_APPS_KEY = 'apex_sim_deck_apps_v2';
const PRIMARY_GAMES_KEY = 'apex_sim_deck_games_v2';

const LEGACY_APP_KEYS = [
  'apex_sim_deck_user_apps_v1',
  'apex_sim_deck_apps_v7',
  'apex_sim_deck_apps_v6',
  'apex_sim_deck_apps_v5',
  'apex_sim_deck_apps_custom',
  'apex_sim_deck_apps'
];

const LEGACY_GAME_KEYS = [
  'apex_sim_deck_user_games_v1',
  'apex_sim_deck_games_v7',
  'apex_sim_deck_games_v6',
  'apex_sim_deck_games_v5',
  'apex_sim_deck_games_custom',
  'apex_sim_deck_games'
];

export function loadApps() {
  try {
    const raw = localStorage.getItem(PRIMARY_APPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Check legacy storage keys if present
    for (const key of LEGACY_APP_KEYS) {
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(PRIMARY_APPS_KEY, legacyRaw);
            return parsed;
          }
        } catch (e) {}
      }
    }

    // Fallback to exact user default presets
    localStorage.setItem(PRIMARY_APPS_KEY, JSON.stringify(INITIAL_APPS));
    return INITIAL_APPS;
  } catch (e) {
    console.error('Failed to load apps from storage:', e);
    return INITIAL_APPS;
  }
}

export function saveApps(apps) {
  try {
    localStorage.setItem(PRIMARY_APPS_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save apps to storage:', e);
  }
}

export function loadGames() {
  try {
    const raw = localStorage.getItem(PRIMARY_GAMES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Check legacy storage keys if present
    for (const key of LEGACY_GAME_KEYS) {
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(PRIMARY_GAMES_KEY, legacyRaw);
            return parsed;
          }
        } catch (e) {}
      }
    }

    // Fallback to exact user default presets
    localStorage.setItem(PRIMARY_GAMES_KEY, JSON.stringify(INITIAL_GAMES));
    return INITIAL_GAMES;
  } catch (e) {
    console.error('Failed to load games from storage:', e);
    return INITIAL_GAMES;
  }
}

export function saveGames(games) {
  try {
    localStorage.setItem(PRIMARY_GAMES_KEY, JSON.stringify(games));
  } catch (e) {
    console.error('Failed to save games to storage:', e);
  }
}

export function exportConfig(apps, games) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ apps, games }, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `apex_sim_deck_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function resetToDefaults() {
  localStorage.setItem(PRIMARY_APPS_KEY, JSON.stringify(INITIAL_APPS));
  localStorage.setItem(PRIMARY_GAMES_KEY, JSON.stringify(INITIAL_GAMES));
  return { apps: INITIAL_APPS, games: INITIAL_GAMES };
}
