import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { selectImage } from '../utils/platformApi';

export default function GameModal({ game, category, onSave, onClose }) {
  const [name, setName] = useState(game?.name || '');
  const [description, setDescription] = useState(game?.description || '');
  const [banner, setBanner] = useState(
    game?.banner ||
      (category === 'racing'
        ? 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=800&q=80')
  );

  const handleBrowseImage = async () => {
    const selected = await selectImage();
    if (selected) setBanner(selected);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a Game Name.');
      return;
    }

    onSave({
      id: game?.id || `game-${Date.now()}`,
      name,
      category: game?.category || category,
      description,
      banner,
      profiles: game?.profiles || []
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{game ? 'Edit Simulation Card' : 'Add New Simulation'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Simulation Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Assetto Corsa Evo, Microsoft Flight Simulator 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="Brief description of the simulation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Banner Image (Remote URL or Local File)</label>
              <div className="input-with-button">
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://images.unsplash.com/... or C:\Pictures\banner.png"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                />
                <button type="button" className="btn-primary" onClick={handleBrowseImage}>
                  <FolderOpen size={16} /> Browse PC
                </button>
              </div>
            </div>

            {/* Banner Preview */}
            {banner && (
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '110px', border: '1px solid var(--border-color)', position: 'relative' }}>
                <img src={banner} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '6px', right: '8px', background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#fff' }}>
                  Preview
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-primary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`btn-primary ${category === 'racing' ? 'btn-accent-racing' : 'btn-accent-flight'}`}>
              <Check size={16} /> Save Simulation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
