import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export default function PollCreator({ onCreatePoll, onCancel }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    'React + Vite',
    'Next.js Fullstack',
    'Vue 3 + Vite',
    'SvelteKit'
  ]);
  const [category, setCategory] = useState('Tech Stack');
  const [expiresIn, setExpiresIn] = useState(24);
  const [error, setError] = useState('');

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    if (error) setError('');
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      setError('Maximum 6 options allowed per poll');
      return;
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      setError('A poll requires at least 2 options');
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a clear poll question');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Please provide at least 2 valid answer options');
      return;
    }

    onCreatePoll({
      question: question.trim(),
      options: validOptions,
      category,
      expires_in_hours: Number(expiresIn)
    });
  };

  return (
    <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} color="#38bdf8" /> Create New Live Poll
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Setup a poll with 3 to 4 options and launch live interactive voting
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fda4af',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Question Field */}
        <div className="form-group">
          <label className="form-label">Poll Question</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. What is your preferred web framework for speed?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category & Expiry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.35rem' }}>
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="Tech Stack">Tech Stack</option>
              <option value="AI & Engineering">AI & Engineering</option>
              <option value="Team Culture">Team Culture</option>
              <option value="Design & UX">Design & UX</option>
              <option value="General">General</option>
            </select>
          </div>
          <div>
            <label className="form-label">Poll Duration</label>
            <select
              className="form-input"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="1">1 Hour (Quick Poll)</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours (Standard)</option>
              <option value="48">48 Hours</option>
            </select>
          </div>
        </div>

        {/* Dynamic Answer Options */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Answer Options (3 - 4 Recommended)</label>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{options.length} options</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {options.map((option, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Option ${idx + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      color: '#f43f5e',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove option"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              style={{
                marginTop: '0.85rem',
                width: '100%',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px dashed rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '0.7rem',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} /> Add Another Option
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary">
            <CheckCircle2 size={18} /> Launch Poll Now
          </button>
        </div>
      </form>
    </div>
  );
}
