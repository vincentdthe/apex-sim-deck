import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Search } from 'lucide-react';
import AppEditorModal from './AppEditorModal';

export default function SettingsView({ apps, onAddApp, onEditApp, onDeleteApp }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'racing' | 'flight'
  const [editingApp, setEditingApp] = useState(null); // null or app object
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.exePath.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryFilter === 'racing') return app.categories?.racing;
    if (categoryFilter === 'flight') return app.categories?.flight;
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  const handleSaveApp = (appData) => {
    if (editingApp) {
      onEditApp({ ...editingApp, ...appData });
    } else {
      onAddApp(appData);
    }
  };

  return (
    <div>
      <div className="controls-bar">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fff' }}>Global Application Library</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Register all helper/companion apps and select if they belong to <strong>Racing</strong>, <strong>Flight</strong>, or <strong>Both</strong> setups.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="search-filter-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              placeholder="Search apps or paths..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Companion App</span>
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`nav-tab ${categoryFilter === 'all' ? 'active-settings' : ''}`}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setCategoryFilter('all')}
        >
          All Apps ({apps.length})
        </button>
        <button
          className={`nav-tab ${categoryFilter === 'racing' ? 'active-racing' : ''}`}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setCategoryFilter('racing')}
        >
          🏎️ Racing Apps ({apps.filter(a => a.categories?.racing).length})
        </button>
        <button
          className={`nav-tab ${categoryFilter === 'flight' ? 'active-flight' : ''}`}
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          onClick={() => setCategoryFilter('flight')}
        >
          ✈️ Flight Apps ({apps.filter(a => a.categories?.flight).length})
        </button>
      </div>

      {/* Apps Table */}
      <div className="settings-table-container">
        <table className="settings-table">
          <thead>
            <tr>
              <th>Application Name</th>
              <th>Category Setup</th>
              <th>Executable Path</th>
              <th>Default Launch Args</th>
              <th>Delay</th>
              <th>Auto-Kill</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No companion applications registered for this filter. Click <strong>"Add Companion App"</strong> to create one.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{app.name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {app.categories?.racing && (
                        <span className="badge-pill badge-racing">🏎️ Racing</span>
                      )}
                      {app.categories?.flight && (
                        <span className="badge-pill badge-flight">✈️ Flight</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="exe-path-mono" title={app.exePath}>
                      {app.exePath || <span style={{ color: 'var(--error-color)' }}>Path Not Set</span>}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {app.args || '-'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {app.delay || 0}s
                  </td>
                  <td>
                    {app.autoKill ? (
                      <span style={{ color: 'var(--success-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={14} /> Yes
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>No</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      <button className="btn-icon" onClick={() => handleOpenEditModal(app)} title="Edit App">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => onDeleteApp(app.id)} title="Delete App" style={{ color: 'var(--error-color)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reusable App Editor Modal */}
      {isModalOpen && (
        <AppEditorModal
          app={editingApp}
          onSave={handleSaveApp}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
