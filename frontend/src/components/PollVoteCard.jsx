import React, { useState } from 'react';
import { Vote, BarChart2, CheckCircle2, Lock, Sparkles, Clock, Share2, ShieldCheck } from 'lucide-react';

export default function PollVoteCard({ poll, onVote, onViewResults, hasVoted, userVotedOptionId, onShare }) {
  const [selectedOptionId, setSelectedOptionId] = useState(userVotedOptionId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVoteSubmit = () => {
    if (!selectedOptionId || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onVote(poll.id, selectedOptionId);
      setIsSubmitting(false);
    }, 300);
  };

  const isClosed = poll.status === 'closed';

  return (
    <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {poll.category || 'General'}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={13} /> {poll.creator || 'Community'}
          </span>
        </div>

        <button
          onClick={() => onShare && onShare(poll)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.8rem'
          }}
          title="Share Poll"
        >
          <Share2 size={16} /> Share
        </button>
      </div>

      {/* Question */}
      <h2 style={{
        fontSize: '1.45rem',
        fontWeight: 800,
        color: '#f8fafc',
        lineHeight: 1.35,
        marginBottom: '1.5rem',
        letterSpacing: '-0.01em'
      }}>
        {poll.question}
      </h2>

      {/* Option List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
        {poll.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const isUserVote = userVotedOptionId === opt.id;

          return (
            <button
              key={opt.id}
              className={`option-select-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => !isClosed && setSelectedOptionId(opt.id)}
              disabled={isClosed}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="option-radio">
                  {isSelected && <div className="option-radio-dot" />}
                </div>
                <span>{opt.text}</span>
              </div>

              {isUserVote && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={14} /> Your Choice
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="btn-secondary"
          onClick={onViewResults}
          style={{ fontSize: '0.85rem', padding: '0.7rem 1.1rem' }}
        >
          <BarChart2 size={16} /> View Live Results
        </button>

        <button
          className="btn-primary"
          onClick={handleVoteSubmit}
          disabled={!selectedOptionId || isSubmitting || isClosed}
          style={{ padding: '0.75rem 1.75rem' }}
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : isClosed ? (
            <><Lock size={16} /> Poll Closed</>
          ) : hasVoted ? (
            <><CheckCircle2 size={18} /> Update Vote</>
          ) : (
            <><Vote size={18} /> Submit Vote</>
          )}
        </button>
      </div>
    </div>
  );
}
