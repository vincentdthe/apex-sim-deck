import { INITIAL_APPS, INITIAL_GAMES } from '../data/initialData';

const PRIMARY_APPS_KEY = 'apex_sim_deck_apps_v6';
const PRIMARY_GAMES_KEY = 'apex_sim_deck_games_v6';

function isOutdated(apps) {
  if (!Array.isArray(apps) || apps.length === 0) return true;
  // If legacy outdated paths exist, or missing tinypedal/motec, force refresh to new initial data
  const hasTinyPedal = apps.some(a => a.id === 'app-tinypedal');
  const hasOutdatedPaths = apps.some(a => a.exePath && a.exePath.includes('SimTools'));
  return !hasTinyPedal || hasOutdatedPaths;
}

export function loadApps() {
  try {
    const raw = localStorage.getItem(PRIMARY_APPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && !isOutdated(parsed)) {
        return parsed;
      }
    }

    // Initialize with exact user configuration
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
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(g => g.id === 'game-ac')) {
        return parsed;
      }
    }

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
