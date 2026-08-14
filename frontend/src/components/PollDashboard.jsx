import React, { useState } from 'react';
import { Vote, BarChart3, Plus, Search, Filter, Share2, Sparkles, CheckCircle2, Clock, Copy, X } from 'lucide-react';

export default function PollDashboard({ polls, activePollId, onSelectPoll, onCreateClick, onSharePoll }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Engineering', 'AI & Innovation', 'Tech Stack', 'Team Culture'];

  const filteredPolls = polls.filter(p => {
    const matchesSearch = p.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
            Poll Hub & Active Studio
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Explore live polls, cast your votes, or launch a custom poll in seconds
          </p>
        </div>

        <button className="btn-primary" onClick={onCreateClick}>
          <Plus size={18} /> Create New Poll
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search polls by question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${selectedCategory === cat ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                color: selectedCategory === cat ? '#38bdf8' : '#94a3b8',
                padding: '0.55rem 0.9rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Poll Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
        {filteredPolls.map(p => {
          const isActive = p.id === activePollId;
          const leader = [...p.options].sort((a, b) => b.votes - a.votes)[0];

          return (
            <div
              key={p.id}
              className="glass-card"
              style={{
                borderColor: isActive ? 'var(--accent-cyan)' : undefined,
                boxShadow: isActive ? 'var(--shadow-glow)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.35rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#38bdf8',
                    fontWeight: 700,
                    background: 'rgba(56, 189, 248, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {p.category || 'General'}
                  </span>

                  {p.is_preset && (
                    <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700 }}>
                      Preset
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.35, margin: '0 0 1rem 0' }}>
                  {p.question}
                </h3>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BarChart3 size={14} color="#6366f1" />
                  <span>{p.options.length} Answer Options • {p.total_votes} Total Votes</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => onSelectPoll(p.id)}
                  style={{ flex: 1, fontSize: '0.82rem', padding: '0.65rem' }}
                >
                  <Vote size={15} /> {isActive ? 'Active in Studio' : 'Open Poll'}
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => onSharePoll(p)}
                  style={{ padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Share Poll Link"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
