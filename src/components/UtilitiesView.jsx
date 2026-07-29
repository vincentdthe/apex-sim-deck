import React, { useState } from 'react';
import { Play, Search, Terminal, FolderOpen, Check } from 'lucide-react';

export default function UtilitiesView({ apps, onLaunchApp }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'racing' | 'flight'

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.exePath.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterCategory === 'racing') return app.categories?.racing;
    if (filterCategory === 'flight') return app.categories?.flight;
    return true;
  });

  return (
    <div>
      <div className="controls-bar">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            🛠️ Manual Utilities & App Launcher
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Launch any individual hardware utility, telemetry agent, or flight tool manually with a single click.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="search-filter-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              placeholder="Search apps to launch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`nav-tab ${filterCategory === 'all' ? 'active-settings' : ''}`}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setFilterCategory('all')}
        >
          All Utilities ({apps.length})
        </button>
        <button
          className={`nav-tab ${filterCategory === 'racing' ? 'active-racing' : ''}`}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setFilterCategory('racing')}
        >
          🏎️ Racing Apps ({apps.filter(a => a.categories?.racing).length})
        </button>
        <button
          className={`nav-tab ${filterCategory === 'flight' ? 'active-flight' : ''}`}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setFilterCategory('flight')}
        >
          ✈️ Flight Apps ({apps.filter(a => a.categories?.flight).length})
        </button>
      </div>

      {/* Utilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredApps.length === 0 ? (
          <div className="game-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No utilities found. Go to <strong>Settings Tab</strong> to add helper applications.
          </div>
        ) : (
          filteredApps.map((app) => (
            <div key={app.id} className="game-card" style={{ padding: '1.25rem', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#fff' }}>{app.name}</h4>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {app.categories?.racing && <span className="badge-pill badge-racing">Racing</span>}
                    {app.categories?.flight && <span className="badge-pill badge-flight">Flight</span>}
                  </div>
                </div>

                <div className="exe-path-mono" style={{ maxWidth: '100%', marginBottom: '0.5rem' }} title={app.exePath}>
                  <FolderOpen size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {app.exePath || 'Path not set'}
                </div>

                {app.args && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                    <Terminal size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Args: {app.args}
                  </div>
                )}
              </div>

              <button
                className="btn-primary btn-accent-racing"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={() => onLaunchApp(app)}
              >
                <Play size={14} fill="currentColor" />
                <span>Launch App</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
