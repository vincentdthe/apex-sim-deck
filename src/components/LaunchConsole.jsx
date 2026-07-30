import React from 'react';
import { Terminal, CheckCircle2, AlertCircle, X, Cpu, Info } from 'lucide-react';

export default function LaunchConsole({ isVisible, launchData, statusSteps, onClose }) {
  if (!isVisible || !launchData) return null;

  const { gameName, profileName, isVr } = launchData;

  return (
    <div className="console-overlay">
      <div className="console-header">
        <div className="console-title">
          <Terminal size={20} />
          <span>Launch Pipeline Controller — {gameName} ({profileName})</span>
          <span className={isVr ? 'tag-vr' : 'tag-2d'} style={{ marginLeft: '0.5rem' }}>
            {isVr ? 'VR MODE' : '2D MONITOR'}
          </span>
        </div>

        <button className="btn-icon" onClick={onClose} title="Close Console">
          <X size={20} />
        </button>
      </div>

      <div className="console-steps">
        {statusSteps.map((step, idx) => {
          let statusIcon;
          let statusStyle = {};

          if (step.status === 'completed') {
            statusIcon = <CheckCircle2 size={16} color="var(--success-color)" />;
            statusStyle = { borderLeft: '3px solid var(--success-color)' };
          } else if (step.status === 'already_running') {
            statusIcon = <Info size={16} color="var(--telemetry-cyan)" />;
            statusStyle = { borderLeft: '3px solid var(--telemetry-cyan)', background: 'rgba(0, 242, 254, 0.05)' };
          } else if (step.status === 'running') {
            statusIcon = <div className="status-spinner" />;
            statusStyle = { borderLeft: '3px solid var(--telemetry-cyan)', background: 'rgba(0, 242, 254, 0.08)' };
          } else if (step.status === 'error') {
            statusIcon = <AlertCircle size={16} color="var(--error-color)" />;
            statusStyle = { borderLeft: '3px solid var(--error-color)' };
          } else {
            statusIcon = <Cpu size={16} color="var(--text-dim)" />;
            statusStyle = { opacity: 0.6 };
          }

          return (
            <div key={idx} className="console-step-item" style={statusStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {statusIcon}
                <span style={{ fontWeight: 600, color: step.status === 'completed' || step.status === 'already_running' ? '#fff' : 'var(--text-muted)' }}>
                  Step {idx + 1}: {step.name || step.message}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                {step.pid && (
                  <span style={{ fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    PID: {step.pid}
                  </span>
                )}
                <span>{step.message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
