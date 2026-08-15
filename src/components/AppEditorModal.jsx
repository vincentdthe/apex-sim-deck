import React, { useState } from 'react';
import { X, FolderOpen, CheckSquare } from 'lucide-react';

export default function AppEditorModal({ app, onSave, onClose }) {
  const [formData, setFormData] = useState({
    id: app?.id || `app-${Date.now()}`,
    name: app?.name || '',
    exePath: app?.exePath || '',
    args: app?.args || '',
    delay: app?.delay || 0,
    autoKill: app?.autoKill ?? true,
    categories: {
      racing: app?.categories?.racing ?? true,
      flight: app?.categories?.flight ?? false
    }
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter an Application Name.');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{app ? 'Edit Application Settings' : 'Add New Application'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Application Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Moza Cockpit, Fanatec FanaLab, VoiceAttack"
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
            <button type="button" className="btn-primary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-accent-racing">
              <CheckSquare size={16} /> Save Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
