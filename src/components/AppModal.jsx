import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function GameModal({ game, category, onSave, onClose }) {
  const [name, setName] = useState(game?.name || '');
  const [banner, setBanner] = useState(game?.banner || '');
  const [description, setDescription] = useState(game?.description || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: game?.id || `game-${Date.now()}`,
      name,
      category: game?.category || category,
      banner,
      description,
      profiles: game?.profiles || []
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{game ? 'Edit Simulator Game Card' : 'Add New Simulator Game'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Game Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Assetto Corsa Evo, X-Plane 12, Automobilista 2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Banner Image URL (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Short description or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-primary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary btn-accent-racing">
              <Check size={16} /> Save Simulator Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
