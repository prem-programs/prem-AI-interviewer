import React, { useState, useEffect } from 'react';
import { User, Award, CheckCircle, Flame, Briefcase, GraduationCap } from 'lucide-react';

export default function CandidateSelector({ onSelectCandidate }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/candidates')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load candidates');
        return res.json();
      })
      .then((data) => {
        setCandidates(data.candidates || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
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
    const matchesSearch = c.member.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.member.jobRole.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || c.member.jobRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roles = ['ALL', ...new Set(candidates.map((c) => c.member.jobRole))];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="brand-icon" style={{ margin: '0 auto 1rem', width: 56, height: 56 }}>🤖</div>
        <p style={{ color: 'var(--text-muted)' }}>Loading AI Cohort Candidate Profiles...</p>
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
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700 }}>
            Select AI Cohort Graduate
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Choose a candidate profile to launch an adaptive technical interview tailored to their background.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="chat-input"
            style={{ width: 220 }}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="chat-input"
            style={{ width: 180, cursor: 'pointer' }}
          >
            {roles.map((r) => (
              <option key={r} value={r} style={{ background: '#0f172a', color: '#fff' }}>
                {r === 'ALL' ? 'All Roles' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="candidate-grid">
        {filteredCandidates.map((c) => {
          const tier = computeTier(c);
          const initials = c.member.name.split(' ').map(n => n[0]).join('');
          return (
            <div
              key={c.member.id}
              className="candidate-card"
              onClick={() => onSelectCandidate(c)}
            >
              <div className="candidate-header">
                <div className="candidate-avatar">{initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="candidate-name">{c.member.name}</h3>
                    <span className={`tier-badge ${tier.class}`}>{tier.name}</span>
                  </div>
                  <div className="candidate-role" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                    <Briefcase size={13} /> {c.member.jobRole} ({c.member.yearsExperience} yrs exp)
                  </div>
                  <div className="candidate-role" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                    <GraduationCap size={13} /> {c.member.education}
                  </div>
                </div>
              </div>

              <div className="candidate-stats">
                <div className="stat-item">
                  <div className="stat-value">{c.signals.commitDays}</div>
                  <div className="stat-label">Commit Days</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{c.signals.missionsCompleted}/31</div>
                  <div className="stat-label">Missions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{c.signals.missionsFirstTry}</div>
                  <div className="stat-label">First Try</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
