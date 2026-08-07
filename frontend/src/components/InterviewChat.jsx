import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Flag, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function InterviewChat({ candidate, onBackToCandidates, onInterviewFinished }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sess-${candidate.member.id}-${Date.now()}`);
  const [meta, setMeta] = useState({
    questionCount: 0,
    depthTier: 'Intermediate',
    topicsCovered: []
  });

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial Start Interview API call
  useEffect(() => {
    setLoading(true);
    fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        candidate
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.reply) {
          setMessages([{ role: 'assistant', content: data.reply }]);
        }
        if (data.meta) {
          setMeta(data.meta);
        }
      })
      .catch((err) => {
        console.error('Error starting interview:', err);
        setLoading(false);
      });
  }, [candidate, sessionId]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage('');
    
    // Optimistically append user message
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: userText
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.reply) {
          setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        }
        if (data.meta) {
          setMeta(data.meta);
        }
        if (data.done && data.feedback) {
          onInterviewFinished(data.feedback);
        }
      })
      .catch((err) => {
        console.error('Error sending message:', err);
        setLoading(false);
      });
  };

  const handleWrapUp = () => {
    setInputMessage('Please finish interview and generate final feedback summary.');
    handleSendMessage();
  };

  const getTierClass = (tier) => {
    if (tier === 'Expert') return 'tier-expert';
    if (tier === 'Intermediate') return 'tier-intermediate';
    return 'tier-beginner';
  };

  return (
    <div className="chat-container">
      {/* Sidebar Metadata */}
      <div className="sidebar-panel">
        <button
          onClick={onBackToCandidates}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem'
          }}
        >
          <ChevronLeft size={16} /> Back to Candidates
        </button>

        <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="candidate-avatar" style={{ width: 40, height: 40, fontSize: '0.95rem' }}>
              {candidate.member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{candidate.member.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.member.jobRole}</div>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span className={`tier-badge ${getTierClass(meta.depthTier)}`}>
              {meta.depthTier} Tier
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Questions Progress</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{meta.questionCount} / 8+</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min((meta.questionCount / 8) * 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Modules Covered List */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Modules Covered ({meta.topicsCovered?.length || 0}/8)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 200, overflowY: 'auto' }}>
            {meta.topicsCovered?.map((topic, i) => (
              <div key={i} style={{ fontSize: '0.78rem', background: 'rgba(56, 189, 248, 0.1)', padding: '0.35rem 0.6rem', borderRadius: 6, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={13} /> {topic}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleWrapUp}
          disabled={loading}
          style={{
            marginTop: 'auto',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: 'var(--accent-rose)',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Flag size={14} /> Finish & Evaluate
        </button>
      </div>

      {/* Main Chat Stream */}
      <div className="chat-main">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bot size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>AI Technical Interviewer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>● Active Session · Multi-Turn Adaptive Mode</div>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="message-bubble assistant">
              <div className="msg-avatar assistant">
                <Bot size={20} />
              </div>
              <div className="msg-content" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} className="pulse-dot" /> AI Interviewer is evaluating & generating response...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your technical response..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="send-btn" disabled={loading || !inputMessage.trim()}>
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
