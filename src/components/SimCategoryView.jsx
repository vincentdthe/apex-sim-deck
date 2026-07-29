import React, { useState } from 'react';
import { Play, Plus, Edit2, Trash2, Search, Glasses, Monitor, Layers, Settings2 } from 'lucide-react';

export default function SimCategoryView({
  category, // 'racing' | 'flight'
  games,
  allApps,
  onAddGame,
  onEditGame,
  onDeleteGame,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
  onLaunchProfile
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('all'); // 'all' | 'vr' | '2d'

  const categoryGames = games.filter((g) => g.category === category);

  const filteredGames = categoryGames.map((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const filteredProfiles = (game.profiles || []).filter((prof) => {
      if (modeFilter === 'vr') return prof.isVr;
      if (modeFilter === '2d') return !prof.isVr;
      return true;
    });

    return { ...game, profiles: filteredProfiles, matchesSearch };
  }).filter((g) => g.matchesSearch && (g.profiles.length > 0 || searchTerm === ''));

  const isRacing = category === 'racing';
  const categoryTitle = isRacing ? 'Sim Racing Workspace' : 'Flight Simulation Hub';
  const categorySub = isRacing
    ? 'Manage your racing sims (iRacing, LMU, ACC, AC) and launch VR or 2D profiles with automated helper app chains.'
    : 'Manage your flight sims (MSFS 2024, DCS World, X-Plane) and trigger custom avionics, headtracking, and VR app pipelines.';

  return (
    <div>
      {/* Category Controls Bar */}
      <div className="controls-bar">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isRacing ? '🏎️' : '✈️'} {categoryTitle}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            {categorySub}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="search-filter-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              placeholder={`Search ${isRacing ? 'racing' : 'flight'} sims...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              className={`nav-tab ${modeFilter === 'all' ? (isRacing ? 'active-racing' : 'active-flight') : ''}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setModeFilter('all')}
            >
              All Modes
            </button>
            <button
              className={`nav-tab ${modeFilter === 'vr' ? (isRacing ? 'active-racing' : 'active-flight') : ''}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setModeFilter('vr')}
            >
              <Glasses size={14} /> VR Only
            </button>
            <button
              className={`nav-tab ${modeFilter === '2d' ? (isRacing ? 'active-racing' : 'active-flight') : ''}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setModeFilter('2d')}
            >
              <Monitor size={14} /> 2D Monitor
            </button>
          </div>

          <button
            className={`btn-primary ${isRacing ? 'btn-accent-racing' : 'btn-accent-flight'}`}
            onClick={() => onAddGame(category)}
          >
            <Plus size={18} />
            <span>Add New {isRacing ? 'Sim Game' : 'Flight Sim'}</span>
          </button>
        </div>
      </div>

      {/* Game Cards Grid */}
      {filteredGames.length === 0 ? (
        <div className="game-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3>No Simulator Games Found</h3>
          <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>
            Click <strong>"Add New {isRacing ? 'Sim Game' : 'Flight Sim'}"</strong> to create a simulator card and configure your profiles.
          </p>
        </div>
      ) : (
        <div className="games-grid">
          {filteredGames.map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-banner-container">
                <img
                  src={game.banner || (isRacing ? 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=800&q=80')}
                  alt={game.name}
                  className="game-banner-img"
                />
                <div className="game-banner-overlay" />
                <div className="game-header-info">
                  <h3 className="game-title">{game.name}</h3>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button className="btn-icon" onClick={() => onEditGame(game)} title="Edit Game Card">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => onDeleteGame(game.id)} title="Delete Game Card" style={{ color: 'var(--error-color)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="game-card-body">
                {game.description && <p className="game-description">{game.description}</p>}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Profiles ({game.profiles?.length || 0})
                  </span>

                  <button
                    className="btn-primary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                    onClick={() => onAddProfile(game.id, category)}
                  >
                    <Plus size={14} /> New Profile
                  </button>
                </div>

                <div className="profiles-list">
                  {(!game.profiles || game.profiles.length === 0) ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                      No profiles configured yet. Click "+ New Profile" above.
                    </div>
                  ) : (
                    game.profiles.map((profile) => {
                      const enabledAppNames = (profile.enabledAppIds || [])
                        .map((id) => allApps.find((a) => a.id === id)?.name)
                        .filter(Boolean);

                      return (
                        <div key={profile.id} className="profile-item">
                          <div className="profile-left">
                            <span className={profile.isVr ? 'tag-vr' : 'tag-2d'}>
                              {profile.isVr ? 'VR' : '2D'}
                            </span>
                            <div>
                              <div className="profile-name">{profile.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                                {enabledAppNames.length > 0
                                  ? `${enabledAppNames.length} helper apps chained: ${enabledAppNames.slice(0, 2).join(', ')}${enabledAppNames.length > 2 ? '...' : ''}`
                                  : 'No companion apps chained'}
                              </div>
                            </div>
                          </div>

                          <div className="profile-actions">
                            <button
                              className="btn-icon"
                              onClick={() => onEditProfile(game.id, profile, category)}
                              title="Configure Launch Profile"
                            >
                              <Settings2 size={16} />
                            </button>

                            <button
                              className="btn-icon"
                              onClick={() => onDeleteProfile(game.id, profile.id)}
                              title="Delete Profile"
                              style={{ color: 'var(--error-color)' }}
                            >
                              <Trash2 size={16} />
                            </button>

                            <button
                              className={`btn-launch ${isRacing ? 'btn-launch-racing' : 'btn-launch-flight'}`}
                              onClick={() => onLaunchProfile(game, profile)}
                            >
                              <Play size={14} fill="currentColor" />
                              <span>LAUNCH</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
