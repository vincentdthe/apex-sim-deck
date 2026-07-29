import React, { useState, useEffect } from 'react';
import HeaderNav from './components/HeaderNav';
import SettingsView from './components/SettingsView';
import SimCategoryView from './components/SimCategoryView';
import UtilitiesView from './components/UtilitiesView';
import ProfileModal from './components/ProfileModal';
import GameModal from './components/AppModal';
import LaunchConsole from './components/LaunchConsole';
import { loadApps, saveApps, loadGames, saveGames, exportConfig, resetToDefaults } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('racing'); // 'racing' | 'flight' | 'utilities' | 'settings'
  const [apps, setApps] = useState(() => loadApps());
  const [games, setGames] = useState(() => loadGames());

  // Modal States
  const [activeGameModal, setActiveGameModal] = useState(null); // null | { game, category }
  const [activeProfileModal, setActiveProfileModal] = useState(null); // null | { gameId, category, profile }

  // Console Drawer Launch State
  const [isConsoleVisible, setIsConsoleVisible] = useState(false);
  const [currentLaunchData, setCurrentLaunchData] = useState(null);
  const [launchStatusSteps, setLaunchStatusSteps] = useState([]);

  // Save changes to localStorage whenever state changes
  useEffect(() => {
    saveApps(apps);
  }, [apps]);

  useEffect(() => {
    saveGames(games);
  }, [games]);

  // Subscribe to IPC launch status updates from Electron main process
  useEffect(() => {
    if (window.electronAPI?.onLaunchStatus) {
      const unsubscribe = window.electronAPI.onLaunchStatus((data) => {
        const { stepIndex, status, message, pid } = data;
        setLaunchStatusSteps((prevSteps) => {
          const updated = [...prevSteps];
          if (updated[stepIndex]) {
            updated[stepIndex] = {
              ...updated[stepIndex],
              status,
              message,
              pid: pid || updated[stepIndex].pid
            };
          }
          return updated;
        });
      });
      return () => unsubscribe();
    }
  }, []);

  // --- APP MANAGERS (Settings Tab) ---
  const handleAddApp = (newApp) => {
    setApps((prev) => [...prev, newApp]);
  };

  const handleEditApp = (updatedApp) => {
    setApps((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
  };

  const handleDeleteApp = (appId) => {
    if (confirm('Are you sure you want to delete this companion app registration?')) {
      setApps((prev) => prev.filter((a) => a.id !== appId));
    }
  };

  // --- GAME CARD MANAGERS ---
  const handleSaveGame = (gameData) => {
    setGames((prev) => {
      const exists = prev.some((g) => g.id === gameData.id);
      if (exists) {
        return prev.map((g) => (g.id === gameData.id ? { ...g, ...gameData } : g));
      } else {
        return [...prev, gameData];
      }
    });
  };

  const handleDeleteGame = (gameId) => {
    if (confirm('Delete this game card and all its profiles?')) {
      setGames((prev) => prev.filter((g) => g.id !== gameId));
    }
  };

  // --- PROFILE MANAGERS ---
  const handleSaveProfile = (gameId, profileData) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        const profiles = g.profiles || [];
        const exists = profiles.some((p) => p.id === profileData.id);
        const updatedProfiles = exists
          ? profiles.map((p) => (p.id === profileData.id ? profileData : p))
          : [...profiles, profileData];
        return { ...g, profiles: updatedProfiles };
      })
    );
  };

  const handleDeleteProfile = (gameId, profileId) => {
    if (confirm('Delete this launch profile?')) {
      setGames((prev) =>
        prev.map((g) => {
          if (g.id !== gameId) return g;
          return { ...g, profiles: (g.profiles || []).filter((p) => p.id !== profileId) };
        })
      );
    }
  };

  // --- LAUNCH SINGLE APP (MANUAL UTILITY TAB) ---
  const handleLaunchSingleApp = async (app) => {
    const payload = {
      profileName: 'Manual Utility Launch',
      gameName: app.name,
      gameExe: app.exePath,
      gameArgs: app.args,
      companionApps: []
    };

    setCurrentLaunchData({
      gameName: app.name,
      profileName: 'Manual Utility Launch',
      isVr: false
    });
    setLaunchStatusSteps([{ name: app.name, status: 'pending', message: 'Launching utility app...' }]);
    setIsConsoleVisible(true);

    if (window.electronAPI?.launchProfile) {
      await window.electronAPI.launchProfile(payload);
    } else {
      setLaunchStatusSteps([{ name: app.name, status: 'completed', message: `Simulated launch of ${app.name} [OK]` }]);
    }
  };

  // --- LAUNCH ENGINE (GAME PROFILES) ---
  const handleLaunchProfile = async (game, profile) => {
    const enabledAppIds = profile.enabledAppIds || [];
    const appOverrides = profile.appOverrides || {};

    const companionAppsToRun = enabledAppIds
      .map((id) => {
        const baseApp = apps.find((a) => a.id === id);
        if (!baseApp) return null;
        const override = appOverrides[id] || {};
        return {
          name: baseApp.name,
          exePath: baseApp.exePath,
          args: override.args !== undefined ? override.args : baseApp.args,
          delay: override.delay !== undefined ? override.delay : baseApp.delay,
          autoKill: baseApp.autoKill
        };
      })
      .filter(Boolean);

    const initialSteps = companionAppsToRun.map((app) => ({
      name: app.name,
      status: 'pending',
      message: `Queued (Delay: ${app.delay}s)`
    }));

    initialSteps.push({
      name: `Main Game Executable (${game.name})`,
      status: 'pending',
      message: `Queued (${profile.args || 'Default flags'})`
    });

    setCurrentLaunchData({
      gameName: game.name,
      profileName: profile.name,
      isVr: profile.isVr
    });
    setLaunchStatusSteps(initialSteps);
    setIsConsoleVisible(true);

    const payload = {
      profileName: profile.name,
      gameName: game.name,
      gameExe: profile.exePath,
      gameArgs: profile.args,
      companionApps: companionAppsToRun
    };

    if (window.electronAPI?.launchProfile) {
      await window.electronAPI.launchProfile(payload);
    } else {
      for (let i = 0; i < companionAppsToRun.length; i++) {
        const app = companionAppsToRun[i];
        setLaunchStatusSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'running', message: `Starting ${app.name}...` } : s))
        );
        await new Promise((r) => setTimeout(r, 1200));
        setLaunchStatusSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'completed', message: `Started ${app.name} [SIM OK]` } : s))
        );
      }

      const gameIdx = companionAppsToRun.length;
      setLaunchStatusSteps((prev) =>
        prev.map((s, idx) => (idx === gameIdx ? { ...s, status: 'running', message: `Starting ${game.name}...` } : s))
      );
      await new Promise((r) => setTimeout(r, 1000));
      setLaunchStatusSteps((prev) =>
        prev.map((s, idx) => (idx === gameIdx ? { ...s, status: 'completed', message: `Simulated launch of ${game.name}! [OK]` } : s))
      );
    }
  };

  const handleResetData = () => {
    if (confirm('Reset all apps and game profiles to your customized defaults?')) {
      const reseted = resetToDefaults();
      setApps(reseted.apps);
      setGames(reseted.games);
    }
  };

  return (
    <div className="app-container">
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExport={() => exportConfig(apps, games)}
        onImport={(importedApps, importedGames) => {
          setApps(importedApps);
          setGames(importedGames);
          alert('Configuration imported successfully!');
        }}
        onReset={handleResetData}
      />

      <main className="main-content">
        {activeTab === 'settings' && (
          <SettingsView
            apps={apps}
            onAddApp={handleAddApp}
            onEditApp={handleEditApp}
            onDeleteApp={handleDeleteApp}
          />
        )}

        {activeTab === 'utilities' && (
          <UtilitiesView
            apps={apps}
            onLaunchApp={handleLaunchSingleApp}
          />
        )}

        {(activeTab === 'racing' || activeTab === 'flight') && (
          <SimCategoryView
            category={activeTab}
            games={games}
            allApps={apps}
            onAddGame={(cat) => setActiveGameModal({ game: null, category: cat })}
            onEditGame={(game) => setActiveGameModal({ game, category: game.category })}
            onDeleteGame={handleDeleteGame}
            onAddProfile={(gameId, cat) => setActiveProfileModal({ gameId, category: cat, profile: null })}
            onEditProfile={(gameId, profile, cat) => setActiveProfileModal({ gameId, category: cat, profile })}
            onDeleteProfile={handleDeleteProfile}
            onLaunchProfile={handleLaunchProfile}
          />
        )}
      </main>

      {/* Game Modal */}
      {activeGameModal && (
        <GameModal
          game={activeGameModal.game}
          category={activeGameModal.category}
          onSave={handleSaveGame}
          onClose={() => setActiveGameModal(null)}
        />
      )}

      {/* Profile Modal */}
      {activeProfileModal && (
        <ProfileModal
          gameId={activeProfileModal.gameId}
          category={activeProfileModal.category}
          profile={activeProfileModal.profile}
          allApps={apps}
          onSave={handleSaveProfile}
          onClose={() => setActiveProfileModal(null)}
        />
      )}

      {/* Launch Console Drawer */}
      <LaunchConsole
        isVisible={isConsoleVisible}
        launchData={currentLaunchData}
        statusSteps={launchStatusSteps}
        onClose={() => setIsConsoleVisible(false)}
      />
    </div>
  );
}
