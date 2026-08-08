import React from 'react';
import { Mic, MessageSquare, Radio } from 'lucide-react';

export default function VoiceModeToggle({ voiceMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`voice-toggle-btn ${voiceMode ? 'active' : ''}`}
      title={voiceMode ? "Switch to Text Chat" : "Switch to Speech-to-Speech Voice Mode"}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.85rem',
        borderRadius: '20px',
        border: voiceMode ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid var(--border-subtle)',
        background: voiceMode
          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.25))'
          : 'rgba(15, 23, 42, 0.5)',
        color: voiceMode ? '#38bdf8' : 'var(--text-muted)',
        fontWeight: 600,
        fontSize: '0.82rem',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: voiceMode ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none'
      }}
    >
      {voiceMode ? (
        <>
          <Radio size={14} className="pulse-dot" style={{ color: '#38bdf8' }} />
          <span>Voice Mode</span>
        </>
      ) : (
        <>
          <Mic size={14} />
          <span>Enable Voice</span>
        </>
      )}
    </button>
  );
}
