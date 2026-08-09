import React, { useState, useEffect } from 'react';
import { User, Award, CheckCircle, Flame, Briefcase, GraduationCap, Bot, Search, ArrowRight, Filter } from 'lucide-react';
import { API_BASE_URL } from '../config';

const FALLBACK_CANDIDATES = [
  {
    member: { id: "CAND-001", name: "Sarah Johnson", jobRole: "Senior Data Engineer", yearsExperience: 9, education: "MS Computer Science", status: "COMPLETED" },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
      { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 }
    ],
    signals: { commitDays: 28, missionsCompleted: 30, missionsFirstTry: 20 }
  },
  {
    member: { id: "CAND-002", name: "Alex Turner", jobRole: "Backend Software Engineer", yearsExperience: 5, education: "B.Tech Computer Science", status: "COMPLETED" },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 3 },
      { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 3 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 2 }
    ],
    signals: { commitDays: 22, missionsCompleted: 29, missionsFirstTry: 10 }
  },
  {
    member: { id: "CAND-003", name: "Emily Chen", jobRole: "AI/ML Solutions Architect", yearsExperience: 11, education: "Ph.D. Computer Science", status: "COMPLETED" },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 1 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 }
    ],
    signals: { commitDays: 31, missionsCompleted: 31, missionsFirstTry: 28 }
  },
  {
    member: { id: "CAND-004", name: "Marcus Brody", jobRole: "Junior Fullstack Developer", yearsExperience: 1, education: "B.S. Information Technology", status: "COMPLETED" },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 4 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 5 },
      { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 3 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 4 }
    ],
    signals: { commitDays: 14, missionsCompleted: 18, missionsFirstTry: 5 }
  }
];

export default function CandidateSelector({ onSelectCandidate }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  const fetchCandidates = (isRetry = false) => {
    fetch(`${API_BASE_URL}/api/candidates`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load candidates');
        return res.json();
      })
      .then((data) => {
        if (data.candidates && data.candidates.length > 0) {
          setCandidates(data.candidates);
          setError(null);
        } else {
          setCandidates(FALLBACK_CANDIDATES);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('API fetch warning, using candidate fallback list:', err);
        setCandidates(FALLBACK_CANDIDATES);
        setError(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const computeTier = (candidate) => {
    const signals = candidate.signals || {};
    const completed = signals.missionsCompleted || 0;
    const firstTry = signals.missionsFirstTry || 0;
    const ratio = completed > 0 ? firstTry / completed : 0;
    if (ratio > 0.8) return { name: 'Expert', class: 'tier-expert' };
    if (ratio >= 0.5) return { name: 'Intermediate', class: 'tier-intermediate' };
    return { name: 'Beginner', class: 'tier-beginner' };
  };

  const filteredCandidates = candidates.filter((c) => {
    const tier = computeTier(c);
    const matchesSearch = c.member.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.member.jobRole.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || c.member.jobRole === roleFilter;
    const matchesTier = tierFilter === 'ALL' || tier.name.toUpperCase() === tierFilter.toUpperCase();
    return matchesSearch && matchesRole && matchesTier;
  });

  const roles = ['ALL', ...new Set(candidates.map((c) => c.member.jobRole))];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="brand-icon" style={{ margin: '0 auto 1.25rem', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={32} color="#38bdf8" />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>Loading AI Cohort Candidate Profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-rose)' }}>
        <p>Error loading candidates: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {/* Hero Bar */}
      <div style={{
        background: '#0f172a',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        marginBottom: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Select AI Cohort Graduate
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
            Choose a candidate profile to launch a multi-turn adaptive technical evaluation across 8 core modules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid var(--border-subtle)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total Candidates: <strong style={{ color: '#fff' }}>{candidates.length}</strong>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="chat-input"
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Tier Tabs */}
          <div style={{ display: 'flex', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '3px' }}>
            {['ALL', 'EXPERT', 'INTERMEDIATE', 'BEGINNER'].map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                style={{
                  background: tierFilter === t ? '#1e293b' : 'transparent',
                  color: tierFilter === t ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Role Dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="chat-input"
            style={{ width: 170, cursor: 'pointer', outline: 'none' }}
          >
            {roles.map((r) => (
              <option key={r} value={r} style={{ background: '#0f172a', color: '#fff' }}>
                {r === 'ALL' ? 'All Roles' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="candidate-grid">
        {filteredCandidates.map((c) => {
          const tier = computeTier(c);
          const initials = c.member.name.split(' ').map(n => n[0]).join('');
          const missionPercent = Math.min(100, Math.round(((c.signals.missionsCompleted || 0) / 31) * 100));

          return (
            <div
              key={c.member.id}
              className="candidate-card"
              onClick={() => onSelectCandidate(c)}
            >
              <div className="candidate-header">
                <div className="candidate-avatar">{initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                    <h3 className="candidate-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.member.name}</h3>
                    <span className={`tier-badge ${tier.class}`}>{tier.name}</span>
                  </div>
                  <div className="candidate-role" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 3 }}>
                    <Briefcase size={12} /> {c.member.jobRole} ({c.member.yearsExperience} yrs)
                  </div>
                  <div className="candidate-role" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                    <GraduationCap size={12} /> {c.member.education}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  <span>Cohort Mission Completion</span>
                  <strong style={{ color: '#fff' }}>{c.signals.missionsCompleted}/31 ({missionPercent}%)</strong>
                </div>
                <div style={{ height: '5px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${missionPercent}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: '3px' }} />
                </div>
              </div>

              <div className="candidate-stats">
                <div className="stat-item">
                  <div className="stat-value">{c.signals.commitDays}</div>
                  <div className="stat-label">Commit Days</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{c.signals.missionsCompleted}</div>
                  <div className="stat-label">Missions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{c.signals.missionsFirstTry}</div>
                  <div className="stat-label">First Try</div>
                </div>
              </div>

              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                <span>Start Technical Interview</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

