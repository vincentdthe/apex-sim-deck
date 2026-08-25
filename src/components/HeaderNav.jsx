import React, { useState, useEffect } from 'react';
import { Flag, Plane, AppWindow, Settings, Download, Upload, RefreshCw, Gauge, Sparkles, ExternalLink, X } from 'lucide-react';

export default function HeaderNav({ activeTab, setActiveTab, onExport, onImport, onReset }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.checkUpdate) {
      window.electronAPI.checkUpdate().then((res) => {
        if (res && res.success) {
          setUpdateInfo(res);
        }
      });
    }
  }, []);

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.apps && parsed.games) {
          onImport(parsed.apps, parsed.games);
        } else {
          alert('Invalid configuration JSON file.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="header-nav">
        <div className="brand-logo">
          <div className="brand-icon">
            <Gauge size={22} />
          </div>
          <div>
            <div className="brand-title">
              ApexLaunch <span style={{ color: 'var(--telemetry-cyan)', fontWeight: 400 }}>Sim Deck</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              v{updateInfo?.currentVersion || '1.0.1'}
            </div>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'racing' ? 'active-racing' : ''}`}
            onClick={() => setActiveTab('racing')}
          >
            <Flag size={18} />
            <span>Racing</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'flight' ? 'active-flight' : ''}`}
            onClick={() => setActiveTab('flight')}
          >
            <Plane size={18} />
            <span>Flight</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'utilities' ? 'active-apps' : ''}`}
            onClick={() => setActiveTab('utilities')}
          >
            <AppWindow size={18} />
            <span>Apps</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active-settings' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Update Available Badge */}
          {updateInfo?.updateAvailable && (
            <button
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                color: '#000',
                border: 'none',
                boxShadow: '0 0 15px rgba(0, 242, 254, 0.5)',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem'
              }}
              onClick={() => setIsUpdateModalOpen(true)}
            >
              <Sparkles size={16} />
              <span>Update {updateInfo.latestVersion} Available!</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-icon" onClick={onExport} title="Export Configuration JSON">
              <Download size={18} />
            </button>
            <label className="btn-icon" title="Import Configuration JSON" style={{ cursor: 'pointer' }}>
              <Upload size={18} />
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
            <button className="btn-icon" onClick={onReset} title="Reset to Preset Defaults">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Auto-Update Modal */}
      {isUpdateModalOpen && updateInfo && (
        <div className="modal-overlay" onClick={() => setIsUpdateModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--telemetry-cyan)' }}>
                <Sparkles size={20} /> New Update Available: {updateInfo.latestVersion}
              </h3>
              <button className="btn-icon" onClick={() => setIsUpdateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  A new version of <strong>ApexLaunch Sim Deck</strong> is ready for download!
                </div>
                <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--telemetry-cyan)' }}>
                  Current Version: v{updateInfo.currentVersion} → New Version: {updateInfo.latestVersion}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Release Notes</label>
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.9rem', fontSize: '0.85rem', color: 'var(--text-main)', maxHeight: '180px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                  {updateInfo.releaseNotes}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={() => setIsUpdateModalOpen(false)}>
                Later
              </button>

              <a
                href={updateInfo.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, var(--telemetry-cyan), #4facfe)', color: '#000', border: 'none', fontWeight: 700, textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> Download Update Package
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
