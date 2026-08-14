import React from 'react';
import { PieChart, TrendingUp, Users, Award, Clock, Sparkles, CheckCircle2, Flame } from 'lucide-react';

export default function PollAnalytics({ polls }) {
  const totalPolls = polls.length;
  const totalVotesAcrossAll = polls.reduce((acc, p) => acc + (p.total_votes || 0), 0);
  
  // Find top voted poll
  const mostPopularPoll = [...polls].sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))[0];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Card 1: Total Engagement */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Total Votes Cast
            </span>
            <Users size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {totalVotesAcrossAll}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={13} /> Across {totalPolls} active polls
          </div>
        </div>

        {/* Card 2: Active Polls */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Active Polls
            </span>
            <PieChart size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {totalPolls}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            100% Real-time sync enabled
          </div>
        </div>

        {/* Card 3: Top Trending Poll */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Top Trending Poll
            </span>
            <Flame size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {mostPopularPoll ? mostPopularPoll.question : 'N/A'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '0.25rem', fontWeight: 700 }}>
            {mostPopularPoll ? `${mostPopularPoll.total_votes} votes` : '0 votes'}
          </div>
        </div>
      </div>

      {/* Breakdown per Poll Table / Cards */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} color="#38bdf8" /> Individual Poll Breakdown & Insights
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {polls.map(p => {
            const leader = [...p.options].sort((a, b) => b.votes - a.votes)[0];
            const leaderPct = p.total_votes > 0 ? ((leader.votes / p.total_votes) * 100).toFixed(1) : 0;

            return (
              <div
                key={p.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                      {p.category || 'General'}
                    </span>
                    <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                      {p.question}
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                      {p.total_votes} votes
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {p.options.length} Options
                    </div>
                  </div>
                </div>

                {/* Leading Option Banner */}
                {leader && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                      👑 Top Choice: {leader.text}
                    </span>
                    <span style={{ color: '#f8fafc', fontWeight: 800 }}>
                      {leaderPct}% ({leader.votes} votes)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
