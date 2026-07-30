import { INITIAL_APPS, INITIAL_GAMES } from '../data/initialData';

// Versioned storage keys so preset updates auto-apply to existing users
const APPS_KEY = 'apex_sim_deck_apps_v6';
const GAMES_KEY = 'apex_sim_deck_games_v6';

export function loadApps() {
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (!raw) return INITIAL_APPS;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load apps from localStorage:', e);
    return INITIAL_APPS;
  }
}

export function saveApps(apps) {
  try {
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save apps to localStorage:', e);
  }
}

export function loadGames() {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return INITIAL_GAMES;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load games from localStorage:', e);
    return INITIAL_GAMES;
  }
}

export function saveGames(games) {
  try {
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  } catch (e) {
    console.error('Failed to save games to localStorage:', e);
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
  localStorage.removeItem(APPS_KEY);
  localStorage.removeItem(GAMES_KEY);
  return { apps: INITIAL_APPS, games: INITIAL_GAMES };
}
