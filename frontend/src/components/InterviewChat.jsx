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
    if (!userText || !userText.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
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
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.reply) {
          setMessages([
            ...newMessages,
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
        console.error('Error sending message:', err);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, voiceMode, loading]);

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
    <div className="chat-container">
      <VoiceSetup
        isOpen={showVoiceSetup}
        onClose={() => setShowVoiceSetup(false)}
        onConfirm={handleConfirmVoiceSetup}
        sessionId={sessionId}
      />

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
            <span style={{ color: 'var(--text-muted)' }}>Main Questions</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{currentMainQ} / 5</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min((currentMainQ / 5) * 100, 100)}%`,
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
