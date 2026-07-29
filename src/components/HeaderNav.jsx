import React from 'react';
import { Flag, Plane, Wrench, Settings, Download, Upload, RefreshCw, Gauge } from 'lucide-react';

export default function HeaderNav({ activeTab, setActiveTab, onExport, onImport, onReset }) {
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
    <header className="header-nav">
      <div className="brand-logo">
        <div className="brand-icon">
          <Gauge size={22} />
        </div>
        <div className="brand-title">ApexLaunch <span style={{ color: 'var(--telemetry-cyan)', fontWeight: 400 }}>Sim Deck</span></div>
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
          className={`nav-tab ${activeTab === 'utilities' ? 'active-racing' : ''}`}
          onClick={() => setActiveTab('utilities')}
        >
          <Wrench size={18} />
          <span>Utilities</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active-settings' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </nav>

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
    </header>
  );
}
