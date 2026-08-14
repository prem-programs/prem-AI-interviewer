import React from 'react';
import { BarChart3, Crown, Vote, Share2, Sparkles, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

export default function PollResults({ poll, onBackToVote, userVotedOptionId, onShare, isSimulating, onToggleSimulation }) {
  const totalVotes = poll.total_votes || 0;

  // Calculate highest vote count to find leader(s)
  const maxVotes = Math.max(...poll.options.map(o => o.votes), 0);

  return (
    <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <BarChart3 size={14} /> LIVE RESULTS
          </span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Users size={14} /> {totalVotes} {totalVotes === 1 ? 'Vote' : 'Total Votes'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onToggleSimulation}
            style={{
              background: isSimulating ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isSimulating ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: isSimulating ? '#34d399' : '#94a3b8',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Toggle simulated live votes coming in real-time"
          >
            <Sparkles size={13} /> {isSimulating ? 'Live Sim: ON' : 'Live Sim: OFF'}
          </button>

          <button
            onClick={() => onShare && onShare(poll)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.78rem'
            }}
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Question Header */}
      <h2 style={{
        fontSize: '1.4rem',
        fontWeight: 800,
        color: '#f8fafc',
        lineHeight: 1.35,
        marginBottom: '1.5rem'
      }}>
        {poll.question}
      </h2>

      {/* Animated Percentage Bar Chart List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
        {poll.options.map((opt) => {
          const votes = opt.votes || 0;
          const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
          const isLeader = maxVotes > 0 && votes === maxVotes;
          const isUserVote = userVotedOptionId === opt.id;

          return (
            <div
              key={opt.id}
              className={`result-bar-wrapper ${isLeader ? 'leader' : ''}`}
            >
              <div className="result-bar-header">
                <div className="result-option-text">
                  <span>{opt.text}</span>
                  {isLeader && (
                    <span className="leader-badge">
                      <Crown size={11} /> Leader
                    </span>
                  )}
                  {isUserVote && (
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      You Voted
                    </span>
                  )}
                </div>

                <div className="result-stats-text">
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isLeader ? '#fbbf24' : '#38bdf8' }}>
                    {percentage}%
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem', fontWeight: 600 }}>
                    ({votes} {votes === 1 ? 'vote' : 'votes'})
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="result-bar-track">
                <div
                  className={`result-bar-fill ${isLeader ? 'leader-fill' : ''}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Summary Pill */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          <TrendingUp size={16} color="#38bdf8" />
          <span>
            Leading by <strong style={{ color: '#f8fafc' }}>
              {maxVotes > 0 && totalVotes > 0
                ? `${((maxVotes / totalVotes) * 100).toFixed(0)}% of total votes`
                : '0 votes'}
            </strong>
          </span>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Real-time synchronized
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="btn-secondary"
          onClick={onBackToVote}
          style={{ fontSize: '0.85rem', padding: '0.7rem 1.2rem' }}
        >
          <Vote size={16} /> Back to Vote / Change Selection
        </button>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          ⚡ Updated Live
        </div>
      </div>
    </div>
  );
}
