import React, { useState } from 'react';
import { X, Check, FolderOpen, Glasses, Monitor, Clock, Terminal } from 'lucide-react';

export default function ProfileModal({
  gameId,
  category, // 'racing' | 'flight'
  profile, // null for new, profile object for edit
  allApps,
  onSave,
  onClose
}) {
  const [name, setName] = useState(profile?.name || (category === 'racing' ? 'iRacing VR Mode' : 'DCS VR Profile'));
  const [isVr, setIsVr] = useState(profile?.isVr ?? true);
  const [exePath, setExePath] = useState(profile?.exePath || '');
  const [args, setArgs] = useState(profile?.args || (isVr ? '-vr' : ''));
  const [autoLaunchGame, setAutoLaunchGame] = useState(profile?.autoLaunchGame ?? true);
  const [enabledAppIds, setEnabledAppIds] = useState(profile?.enabledAppIds || []);
  const [appOverrides, setAppOverrides] = useState(profile?.appOverrides || {});

  // Filter apps relevant to this category (Racing, Flight, or Both)
  const categoryRelevantApps = allApps.filter((app) => {
    if (category === 'racing') return app.categories?.racing;
    if (category === 'flight') return app.categories?.flight;
    return true;
  });

  const handleBrowseExe = async () => {
    if (window.electronAPI?.selectExe) {
      const selected = await window.electronAPI.selectExe();
      if (selected) setExePath(selected);
    } else {
      const pathPrompt = prompt('Enter Game Executable Path:', exePath);
      if (pathPrompt !== null) setExePath(pathPrompt);
    }
  };

  const toggleAppId = (appId) => {
    if (enabledAppIds.includes(appId)) {
      setEnabledAppIds(enabledAppIds.filter((id) => id !== appId));
    } else {
      setEnabledAppIds([...enabledAppIds, appId]);
    }
  };

  const handleOverrideChange = (appId, field, value) => {
    setAppOverrides((prev) => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {}),
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a profile name.');
      return;
    }

    onSave(gameId, {
      id: profile?.id || `prof-${Date.now()}`,
      name,
      isVr,
      exePath,
      args,
      autoLaunchGame,
      enabledAppIds,
      appOverrides
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {profile ? 'Edit Launch Profile' : 'Create Custom Launch Profile'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Profile Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. iRacing VR Quest 3, DCS 2D Triple Monitor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Mode</label>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '2px' }}>
                  <button
                    type="button"
                    className={`nav-tab ${isVr ? 'active-racing' : ''}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                    onClick={() => { setIsVr(true); if (!args) setArgs('-vr'); }}
                  >
                    <Glasses size={14} /> VR Mode
                  </button>
                  <button
                    type="button"
                    className={`nav-tab ${!isVr ? 'active-settings' : ''}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                    onClick={() => { setIsVr(false); if (args === '-vr') setArgs(''); }}
                  >
                    <Monitor size={14} /> 2D Monitor
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Game Executable Path (.exe)</label>
              <div className="input-with-button">
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  placeholder="C:\Program Files\SimGame\Game.exe"
                  value={exePath}
                  onChange={(e) => setExePath(e.target.value)}
                />
                <button type="button" className="btn-primary" onClick={handleBrowseExe}>
                  <FolderOpen size={16} /> Browse
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Game Launch Arguments (Optional)</label>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)' }}
                placeholder="-vr -openxr -dx12"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
              />
            </div>

            {/* Auto Launch Game Executable Toggle */}
            <div className="form-group" style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={autoLaunchGame}
                  onChange={(e) => setAutoLaunchGame(e.target.checked)}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    Automatically launch main game executable
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {autoLaunchGame
                      ? 'Launching this profile will start your background apps and then run the game.'
                      : 'Launching this profile will set up your background apps ONLY (game will not be started).'}
                  </span>
                </div>
              </label>
            </div>

            {/* Companion Apps Selection Checklist */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="form-label">
                  Auto-Launch Companion Apps ({enabledAppIds.length} Selected)
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Filtered for {category === 'racing' ? '🏎️ Racing' : '✈️ Flight'} setup
                </span>
              </div>

              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem', maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {categoryRelevantApps.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    No companion apps found for this category. Go to <strong>Settings Tab</strong> to add helper apps.
                  </div>
                ) : (
                  categoryRelevantApps.map((app) => {
                    const isChecked = enabledAppIds.includes(app.id);
                    const override = appOverrides[app.id] || {};

                    return (
                      <div
                        key={app.id}
                        style={{
                          background: isChecked ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                          border: `1px solid ${isChecked ? 'rgba(0, 242, 254, 0.25)' : 'transparent'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label className="checkbox-group">
                            <input
                              type="checkbox"
                              className="checkbox-input"
                              checked={isChecked}
                              onChange={() => toggleAppId(app.id)}
                            />
                            <span style={{ fontWeight: 600, color: isChecked ? '#fff' : 'var(--text-muted)' }}>
                              {app.name}
                            </span>
                          </label>

                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {app.categories?.racing && <span className="badge-pill badge-racing" style={{ fontSize: '0.65rem' }}>Racing</span>}
                            {app.categories?.flight && <span className="badge-pill badge-flight" style={{ fontSize: '0.65rem' }}>Flight</span>}
                          </div>
                        </div>

                        {isChecked && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.6rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={14} color="var(--text-muted)" />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delay:</span>
                              <input
                                type="number"
                                min="0"
                                max="60"
                                className="form-input"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                                value={override.delay !== undefined ? override.delay : app.delay || 0}
                                onChange={(e) => handleOverrideChange(app.id, 'delay', parseInt(e.target.value) || 0)}
                              />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>s</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Terminal size={14} color="var(--text-muted)" />
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
                                placeholder={`Args override (Default: ${app.args || 'None'})`}
                                value={override.args !== undefined ? override.args : app.args || ''}
                                onChange={(e) => handleOverrideChange(app.id, 'args', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-primary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`btn-primary ${category === 'racing' ? 'btn-accent-racing' : 'btn-accent-flight'}`}>
              <Check size={16} /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
