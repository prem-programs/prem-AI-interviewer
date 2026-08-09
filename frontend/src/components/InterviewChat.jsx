import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Flag, Sparkles, CheckCircle2, ChevronLeft, SkipForward } from 'lucide-react';
import MessageBubble from './MessageBubble';
import VoiceModeToggle from './VoiceModeToggle';
import VoiceSetup from './VoiceSetup';
import VoiceInterviewChat from './VoiceInterviewChat';
import { API_BASE_URL } from '../config';

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

  const [voiceMode, setVoiceMode] = useState(false);
  const [showVoiceSetup, setShowVoiceSetup] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('alba');

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
    fetch(`${API_BASE_URL}/api/interview`, {
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
        const name = candidate.member?.name || 'Candidate';
        setMessages([{
          role: 'assistant',
          content: `Welcome ${name}! It's a pleasure to conduct your AI Cohort technical evaluation today. Let's begin with Module 1 (Environment & Tooling): Could you walk me through how you set up your local development environment for AI development, specifically virtual environments and local LLMs like Ollama?`
        }]);
      });
  }, [candidate, sessionId]);

  // useCallback so VoiceInterviewChat gets a stable onSendMessage reference
  const sendTextTurn = useCallback((userText) => {
    if (!userText || !userText.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    fetch(`${API_BASE_URL}/api/interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: userText,
        voice_mode: voiceMode
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLoading(false);
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.reply,
              isFollowUp: data.isFollowUp || data.meta?.isFollowUp,
              evaluationScore: data.evaluationScore || data.meta?.evaluationScore
            }
          ]);
        }
        if (data.meta) setMeta(data.meta);
        if (data.done && data.feedback) onInterviewFinished(data.feedback);
      })
      .catch((err) => {
        console.error('Error sending message to backend:', err);
        setLoading(false);
        // Fallback response so conversation never hangs on network glitches
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "Got it! Let me evaluate your response and ask the next technical question..."
          }
        ]);
      });
  }, [sessionId, voiceMode, onInterviewFinished]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;
    const text = inputMessage;
    setInputMessage('');
    sendTextTurn(text);
  };

  const handleSkipQuestion = () => {
    sendTextTurn('Skip question');
  };

  const handleToggleVoiceMode = () => {
    if (!voiceMode) {
      setShowVoiceSetup(true);
    } else {
      setVoiceMode(false);
    }
  };

  const handleConfirmVoiceSetup = (voiceId) => {
    if (voiceId) setSelectedVoice(voiceId);
    setShowVoiceSetup(false);
    setVoiceMode(true);
  };

  const handleWrapUp = () => {
    sendTextTurn('Please finish interview and generate final feedback summary.');
  };

  const getTierClass = (tier) => {
    if (tier === 'Expert') return 'tier-expert';
    if (tier === 'Intermediate') return 'tier-intermediate';
    return 'tier-beginner';
  };

  const currentMainQ = meta.mainQuestionCount || 1;

  if (voiceMode) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <VoiceModeToggle voiceMode={voiceMode} onToggle={handleToggleVoiceMode} />
        </div>
        <VoiceInterviewChat
          candidate={candidate}
          sessionId={sessionId}
          messages={messages}
          loading={loading}
          meta={meta}
          selectedVoice={selectedVoice}
          onSendMessage={sendTextTurn}
          onBackToCandidates={onBackToCandidates}
          onWrapUp={handleWrapUp}
        />
        <VoiceSetup
          isOpen={showVoiceSetup}
          onClose={() => setShowVoiceSetup(false)}
          onConfirm={handleConfirmVoiceSetup}
          sessionId={sessionId}
        />
      </>
    );
  }


  return (
    <div className="chat-container" style={{
      height: 'calc(100vh - 130px)',
      maxHeight: '640px',
      minHeight: '480px',
      overflow: 'hidden'
    }}>
      <VoiceSetup
        isOpen={showVoiceSetup}
        onClose={() => setShowVoiceSetup(false)}
        onConfirm={handleConfirmVoiceSetup}
        sessionId={sessionId}
      />

      {/* Sidebar Metadata */}
      <div className="sidebar-panel" style={{
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          onClick={onBackToCandidates}
          style={{
            background: '#0f172a',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            padding: '0.45rem 0.75rem',
            borderRadius: '6px',
            flexShrink: 0
          }}
        >
          <ChevronLeft size={15} /> Back to Candidates
        </button>

        <div style={{ padding: '0.85rem', background: '#0f172a', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="candidate-avatar" style={{ width: 38, height: 38, fontSize: '0.9rem' }}>
              {candidate.member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{candidate.member.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.member.jobRole}</div>
            </div>
          </div>
          <div style={{ marginTop: '0.4rem' }}>
            <span className={`tier-badge ${getTierClass(meta.depthTier)}`}>
              {meta.depthTier} Tier
            </span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div style={{ flexShrink: 0, background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Interview Progression</span>
            <strong style={{ color: 'var(--primary)' }}>Q{currentMainQ}/8</strong>
          </div>
          <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min((currentMainQ / 8) * 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* 8-Module Step Progress Tracker */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
            Module Roadmap ({meta.topicsCovered?.length || 0}/8)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.2rem' }}>
            {[
              "Environment & Tooling",
              "Data Foundations",
              "Embeddings & Vector Search",
              "LLM Core & Prompting",
              "Chatbot Application Build",
              "Agentic AI & MCP Protocol",
              "Evaluation & Security",
              "Capstone Assessment"
            ].map((modTitle, idx) => {
              const isCovered = meta.topicsCovered?.includes(modTitle) || idx < (meta.topicsCovered?.length || 0);
              const isActive = idx === (meta.topicsCovered?.length || 0);
              
              return (
                <div
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    background: isCovered ? '#052e16' : isActive ? '#0c4a6e' : '#0f172a',
                    border: `1px solid ${isCovered ? '#15803d' : isActive ? '#0284c7' : '#1e293b'}`,
                    padding: '0.4rem 0.6rem',
                    borderRadius: 6,
                    color: isCovered ? '#4ade80' : isActive ? '#38bdf8' : 'var(--text-subtle)',
                    fontWeight: isActive || isCovered ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    flexShrink: 0
                  }}
                >
                  {isCovered ? (
                    <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                  ) : isActive ? (
                    <Sparkles size={13} style={{ flexShrink: 0 }} className="pulse-dot" />
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#334155', flexShrink: 0 }} />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {idx + 1}. {modTitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleWrapUp}
          disabled={loading}
          style={{
            flexShrink: 0,
            marginTop: '0.5rem',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: 'var(--accent-rose)',
            padding: '0.55rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <Flag size={13} /> Finish &amp; Evaluate
        </button>
      </div>

      {/* Main Chat Stream */}
      <div className="chat-main">
        <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bot size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>AI Technical Interviewer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                ● Active Session · Technical Evaluation
              </div>
            </div>
          </div>

          <VoiceModeToggle voiceMode={voiceMode} onToggle={handleToggleVoiceMode} />
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
          <button
            type="button"
            onClick={handleSkipQuestion}
            disabled={loading}
            className="skip-btn"
            title="Skip this question and move directly to the next technical topic"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              borderRadius: 'var(--radius-sm)',
              padding: '0 1.1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
          >
            <SkipForward size={16} /> Skip
          </button>
          <button type="submit" className="send-btn" disabled={loading || !inputMessage.trim()}>
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
