import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ArrowRightCircle, RotateCcw, Users } from 'lucide-react';

export default function FeedbackPanel({ feedback, candidate, onRestart, onSwitchCandidate }) {
  if (!feedback) return null;

  return (
    <div className="feedback-panel">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="brand-icon" style={{ margin: '0 auto 1rem', width: 64, height: 64, fontSize: '2rem' }}>
          🏆
        </div>
        <h2 className="feedback-title">Interview Completed!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Technical Assessment Report for <strong>{candidate?.member?.name}</strong> ({candidate?.member?.jobRole})
        </p>
      </div>

      {/* Summary Box */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} /> Executive Performance Summary
        </h4>
        <p style={{ fontSize: '0.92rem', lineHeight: '1.6', color: '#e2e8f0' }}>
          {feedback.summary}
        </p>
      </div>

      {/* Key Strengths */}
      <div className="feedback-section">
        <h4 className="section-label" style={{ color: 'var(--accent-emerald)' }}>
          <CheckCircle2 size={18} /> Key Technical Strengths
        </h4>
        {feedback.strengths?.map((str, i) => (
          <div key={i} className="list-item" style={{ borderLeft: '3px solid var(--accent-emerald)' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
            <span>{str}</span>
          </div>
        ))}
      </div>

      {/* Identified Skill Gaps */}
      <div className="feedback-section">
        <h4 className="section-label" style={{ color: 'var(--accent-amber)' }}>
          <AlertTriangle size={18} /> Areas for Technical Improvement
        </h4>
        {feedback.gaps?.map((gap, i) => (
          <div key={i} className="list-item" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>!</span>
            <span>{gap}</span>
          </div>
        ))}
      </div>

      {/* Recommended Next Steps */}
      <div className="feedback-section">
        <h4 className="section-label" style={{ color: 'var(--primary)' }}>
          <ArrowRightCircle size={18} /> Actionable Learning Path
        </h4>
        {feedback.next?.map((step, i) => (
          <div key={i} className="list-item" style={{ borderLeft: '3px solid var(--primary)' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>→</span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' }}>
        <button onClick={onRestart} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RotateCcw size={16} /> Re-Interview Candidate
        </button>
        <button onClick={onSwitchCandidate} className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} /> Select Another Candidate
        </button>
      </div>
    </div>
  );
}
