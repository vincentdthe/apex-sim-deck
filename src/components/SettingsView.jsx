import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Check, X, Search, CheckSquare } from 'lucide-react';

export default function SettingsView({ apps, onAddApp, onEditApp, onDeleteApp }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'racing' | 'flight'
  const [editingApp, setEditingApp] = useState(null); // null or app object
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    exePath: '',
    args: '',
    delay: 0,
    autoKill: true,
    categories: { racing: true, flight: false }
  });

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
    setFormData({
      name: '',
      exePath: '',
      args: '',
      delay: 0,
      autoKill: true,
      categories: { racing: true, flight: false }
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app) => {
    setEditingApp(app);
    setFormData({
      name: app.name || '',
      exePath: app.exePath || '',
      args: app.args || '',
      delay: app.delay || 0,
      autoKill: app.autoKill ?? true,
      categories: {
        racing: app.categories?.racing ?? true,
        flight: app.categories?.flight ?? false
      }
    });
    setIsModalOpen(true);
  };

  const handleBrowseExe = async () => {
    if (window.electronAPI?.selectExe) {
      const selected = await window.electronAPI.selectExe();
      if (selected) {
        setFormData((prev) => ({ ...prev, exePath: selected }));
      }
    } else {
      const pathPrompt = prompt('Enter executable full path:', formData.exePath);
      if (pathPrompt !== null) {
        setFormData((prev) => ({ ...prev, exePath: pathPrompt }));
      }
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter an Application Name.');
      return;
    }

    if (editingApp) {
      onEditApp({ ...editingApp, ...formData });
    } else {
      onAddApp({
        id: `app-${Date.now()}`,
        ...formData
      });
    }
    setIsModalOpen(false);
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

      {/* Add / Edit App Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingApp ? 'Edit Companion App' : 'Add New Companion App'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Application Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fanatec FanaLab, Overtake Track Titan, Crew Chief V4"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category Assignment * (Select all that apply)</label>
                  <div className="category-tags">
                    <label className="category-tag-option">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={formData.categories.racing}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categories: { ...formData.categories, racing: e.target.checked }
                          })
                        }
                      />
                      <span style={{ color: 'var(--racing-color)' }}>🏎️ Racing Sim App</span>
                    </label>

                    <label className="category-tag-option">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={formData.categories.flight}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categories: { ...formData.categories, flight: e.target.checked }
                          })
                        }
                      />
                      <span style={{ color: 'var(--flight-color)' }}>✈️ Flight Sim App</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Executable File Path (.exe)</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)' }}
                      placeholder="C:\Program Files\App\App.exe"
                      value={formData.exePath}
                      onChange={(e) => setFormData({ ...formData, exePath: e.target.value })}
                    />
                    <button type="button" className="btn-primary" onClick={handleBrowseExe}>
                      <FolderOpen size={16} /> Browse
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Launch Arguments (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    placeholder="-minimized -silent"
                    value={formData.args}
                    onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Default Launch Delay (Seconds)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      className="form-input"
                      value={formData.delay}
                      onChange={(e) => setFormData({ ...formData, delay: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="checkbox-group" style={{ marginTop: '1.4rem' }}>
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={formData.autoKill}
                        onChange={(e) => setFormData({ ...formData, autoKill: e.target.checked })}
                      />
                      <span>Auto-close app when game exits</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-primary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-accent-racing">
                  <CheckSquare size={16} /> Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
