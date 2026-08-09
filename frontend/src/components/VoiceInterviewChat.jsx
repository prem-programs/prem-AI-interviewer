import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic, MicOff, Volume2, Bot, Sparkles,
  CheckCircle2, ChevronLeft, Flag, AlertCircle, Settings2, ChevronDown, SkipForward
} from 'lucide-react';

import { useVoicePipeline } from '../hooks/useVoicePipeline';

export default function VoiceInterviewChat({
  candidate,
  messages,
  loading,
  meta,
  selectedVoice,
  onSendMessage,
  onBackToCandidates,
  onWrapUp
}) {
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [inputText, setInputText] = useState('');
  const prevMsgRef = useRef(null);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };


  // Stable callback — MUST be useCallback so it doesn't change every render
  // (changing it would trigger recognition rebuild and abort the mic)
  const handleTranscript = useCallback((text) => {
    if (text && text.trim()) onSendMessage(text.trim());
  }, [onSendMessage]);

  const {
    voiceState,
    setVoiceState,
    interimTranscript,
    isSupported,
    error: voiceError,
    availableVoices,
    selectedVoiceName,
    setSelectedVoiceName,
    micVolume,
    autoplayBlocked,
    unlockAudio,
    startListening,
    stopListening,
    playTTSAudio,
    stopSpeaking,
  } = useVoicePipeline({ onTranscriptFinal: handleTranscript, initialVoice: selectedVoice || 'alba' });



  // Auto-play TTS whenever a new assistant message arrives
  useEffect(() => {
    const assistantMsgs = messages.filter(m => m.role === 'assistant');
    const lastMsg = assistantMsgs[assistantMsgs.length - 1];
    if (lastMsg && !loading) {
      const msgKey = lastMsg.id || (lastMsg.content + '_' + assistantMsgs.length);
      if (msgKey !== prevMsgRef.current) {
        prevMsgRef.current = msgKey;
        playTTSAudio(lastMsg.content);
      }
    }
  }, [messages, loading, playTTSAudio]);


  // Show processing state while parent is fetching
  useEffect(() => {
    if (loading && voiceState !== 'SPEAKING') {
      setVoiceState('PROCESSING');
    }
  }, [loading, voiceState, setVoiceState]);

  const handleMicClick = () => {
    if (voiceState === 'SPEAKING') {
      stopSpeaking();
      setTimeout(startListening, 300);
    } else if (voiceState === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  };

  const getStateBadge = () => {
    switch (voiceState) {
      case 'LISTENING':   return { text: '🎤 Listening — speak your answer', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
      case 'PROCESSING':  return { text: '🤔 AI Thinking...', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' };
      case 'SPEAKING':    return { text: '🔊 AI Interviewer Speaking (Pocket TTS)', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' };
      default:            return { text: '⏸ Tap mic or type to respond', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)' };
    }
  };

  const badge = getStateBadge();
  const currentMainQ = meta?.mainQuestionCount || 1;

  // Pocket TTS Voice display name
  const activeVoiceObj = availableVoices.find(v => v.id === selectedVoiceName) || availableVoices[0];
  const displayVoiceName = activeVoiceObj ? activeVoiceObj.name : 'Alba (Pocket TTS)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: '1.25rem',
      height: 'calc(100vh - 140px)',
      maxHeight: '680px',
      minHeight: '500px',
      flex: 1,
      overflow: 'hidden'
    }}>
      {/* ── Left: Voice Stage ── */}
      <div style={{
        background: 'radial-gradient(circle at 50% 35%, rgba(20,30,55,0.98), rgba(9,13,22,1))',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '0',
        height: '100%'
      }}>

        {/* ── Top bar ── */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onBackToCandidates}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ChevronLeft size={15} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Question <strong style={{ color: 'var(--primary)' }}>{currentMainQ}/8</strong>
            </span>
            {meta?.depthTier && (
              <span style={{
                padding:'0.2rem 0.65rem', borderRadius:'99px', fontSize:'0.7rem',
                fontWeight:700, textTransform:'uppercase',
                background:'rgba(56,189,248,0.12)', color:'var(--primary)',
                border:'1px solid rgba(56,189,248,0.3)'
              }}>{meta.depthTier} Tier</span>
            )}
          </div>
        </div>

        {/* ── Center: Orb + Status + Waveform ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1.25rem', margin:'auto 0' }}>

          {/* Animated Orb */}
          <div className={`voice-orb ${voiceState.toLowerCase()}`} onClick={autoplayBlocked ? unlockAudio : undefined} style={{ cursor: autoplayBlocked ? 'pointer' : 'default' }}>
            <div className="orb-core"><Bot size={44} color="#fff"/></div>
            <div className="orb-ring ring-1"/>
            <div className="orb-ring ring-2"/>
            <div className="orb-ring ring-3"/>
          </div>

          {/* Autoplay blocked unlock button */}
          {autoplayBlocked && (
            <button
              onClick={unlockAudio}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                border: 'none',
                color: '#fff',
                padding: '0.5rem 1.1rem',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Volume2 size={16} /> Tap to Play Interviewer Voice
            </button>
          )}

          {/* Status Pill */}
          {!autoplayBlocked && (
            <div style={{
              padding:'0.45rem 1.1rem', borderRadius:'20px',
              background: badge.bg, color: badge.color,
              fontSize:'0.87rem', fontWeight:600,
              display:'flex', alignItems:'center', gap:'0.5rem',
              boxShadow:'0 4px 15px rgba(0,0,0,0.2)'
            }}>
              {voiceState === 'PROCESSING' && <Sparkles size={15} className="pulse-dot"/>}
              {badge.text}
            </div>
          )}

          {/* CSS Animated Waveform */}
          <div className={`css-waveform ${voiceState.toLowerCase()}`}>
            {Array.from({ length: 22 }).map((_, i) => (
              <div key={i} className="waveform-bar" style={{ animationDelay:`${i * 0.065}s` }}/>
            ))}
          </div>

          {/* Interim transcript */}
          {interimTranscript && (
            <div style={{
              fontSize:'0.85rem', color:'#f59e0b', fontStyle:'italic',
              maxWidth:'380px', textAlign:'center', lineHeight:1.4
            }}>
              "{interimTranscript}"
            </div>
          )}

          {/* Browser / Mic error */}
          {voiceError && (
            <div style={{
              display:'flex', alignItems:'center', gap:'0.5rem',
              fontSize:'0.79rem', color:'#f87171',
              background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)',
              padding:'0.5rem 0.9rem', borderRadius:'8px', maxWidth:360, textAlign:'center'
            }}>
              <AlertCircle size={14}/> {voiceError}
            </div>
          )}

        </div>

        {/* ── Bottom: Mic Button + Voice Picker ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.9rem' }}>

          {/* Mic Button */}
          <button
            onClick={handleMicClick}
            disabled={voiceState === 'PROCESSING'}
            className={`mic-btn ${voiceState === 'LISTENING' ? 'active' : ''}`}
            style={voiceState === 'LISTENING' ? {
              boxShadow: `0 0 ${16 + micVolume * 0.45}px rgba(245, 158, 11, ${0.4 + micVolume * 0.005})`,
              transform: `scale(${1 + micVolume * 0.0015})`,
              transition: 'all 0.1s ease-out'
            } : {}}
            title={voiceState === 'LISTENING' ? 'Tap to submit answer' : 'Tap to speak'}
          >
            {voiceState === 'LISTENING' ? <Mic size={30} color="#fff"/>
             : voiceState === 'SPEAKING' ? <Volume2 size={30} color="#fff"/>
             : <MicOff size={30} color="var(--text-muted)"/>}
          </button>

          <span style={{ fontSize:'0.76rem', color:'var(--text-muted)', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem' }}>
            <span>{voiceState === 'LISTENING' ? 'Tap again to stop & submit' : 'Tap mic to speak your answer'}</span>
            {voiceState === 'LISTENING' && (
              <span style={{ fontSize:'0.7rem', color: micVolume > 5 ? '#38bdf8' : '#f59e0b', fontWeight:600 }}>
                {micVolume > 5 ? `🎙️ Mic Input: ${micVolume}%` : '🎙️ Mic Active (Speak into microphone)'}
              </span>
            )}
          </span>


          {/* ── Voice Selector ── */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setShowVoicePicker(p => !p)}
              style={{
                display:'flex', alignItems:'center', gap:'0.4rem',
                background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-subtle)',
                color:'var(--text-muted)', borderRadius:'8px',
                padding:'0.35rem 0.75rem', cursor:'pointer', fontSize:'0.78rem',
                transition:'all 0.2s'
              }}
              title="Change AI voice"
            >
              <Settings2 size={13}/>
              <span style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {displayVoiceName}
              </span>
              <ChevronDown size={12}/>
            </button>

            {showVoicePicker && (
              <div style={{
                position:'absolute', bottom:'calc(100% + 8px)', left:'50%',
                transform:'translateX(-50%)',
                background:'#0f172a', border:'1px solid var(--border-subtle)',
                borderRadius:'10px', padding:'0.5rem',
                minWidth:220, maxHeight:230, overflowY:'auto',
                boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
                zIndex:100
              }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, padding:'0.2rem 0.5rem 0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Select AI Voice
                </div>
                {availableVoices.length === 0 && (
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', padding:'0.5rem' }}>
                    No voices loaded yet...
                  </div>
                )}
                {availableVoices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVoiceName(v.id); setShowVoicePicker(false); }}
                    style={{
                      display:'block', width:'100%', textAlign:'left',
                      background: v.id === selectedVoiceName ? 'rgba(56,189,248,0.12)' : 'transparent',
                      border:'none', color: v.id === selectedVoiceName ? 'var(--primary)' : 'var(--text-main)',
                      padding:'0.45rem 0.65rem', borderRadius:'6px',
                      cursor:'pointer', fontSize:'0.8rem', transition:'background 0.15s'
                    }}
                    onMouseEnter={e => { if (v.id !== selectedVoiceName) e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (v.id !== selectedVoiceName) e.target.style.background = 'transparent'; }}
                  >
                    <div style={{ fontWeight: v.id === selectedVoiceName ? 700 : 400 }}>
                      {v.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Live Transcript Panel ── */}
      <div style={{
        background:'rgba(15,23,42,0.75)', border:'1px solid var(--border-subtle)',
        borderRadius:'16px', padding:'1.25rem',
        display:'flex', flexDirection:'column', height:'100%',
        maxHeight: '100%', minHeight: '0',
        backdropFilter:'blur(10px)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          marginBottom:'0.85rem', borderBottom:'1px solid var(--border-subtle)', paddingBottom:'0.75rem',
          flexShrink: 0
        }}>
          <div style={{ fontWeight:700, fontSize:'0.92rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Bot size={17} style={{ color:'var(--primary)' }}/> Live Transcript
          </div>
          <div style={{ display:'flex', gap:'0.4rem', alignItems:'center' }}>
            <button
              onClick={() => onSendMessage('Skip question')}
              disabled={loading}
              style={{
                background:'rgba(245, 158, 11, 0.15)', border:'1px solid rgba(245, 158, 11, 0.35)',
                color:'#f59e0b', padding:'0.32rem 0.6rem',
                borderRadius:'6px', cursor:'pointer', fontWeight:600,
                fontSize:'0.74rem', display:'flex', alignItems:'center', gap:'0.3rem'
              }}
              title="Skip this question and move directly to the next technical topic"
            >
              <SkipForward size={11}/> Skip
            </button>
            <button
              onClick={onWrapUp}
              disabled={loading}
              style={{
                background:'rgba(244,63,94,0.12)', border:'1px solid rgba(244,63,94,0.3)',
                color:'var(--accent-rose)', padding:'0.32rem 0.6rem',
                borderRadius:'6px', cursor:'pointer', fontWeight:600,
                fontSize:'0.74rem', display:'flex', alignItems:'center', gap:'0.3rem'
              }}>
              <Flag size={11}/> Finish
            </button>
          </div>
        </div>


        {/* Messages */}
        <div style={{
          flex:1, minHeight:0, overflowY:'auto', display:'flex',
          flexDirection:'column', gap:'0.75rem', paddingRight:'0.25rem'
        }}>

          {messages.length === 0 && (
            <div style={{ color:'var(--text-muted)', fontSize:'0.82rem', textAlign:'center', marginTop:'2rem', lineHeight:1.6 }}>
              Tap the mic and start speaking.<br/>Your conversation will appear here.
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{
              background: msg.role === 'assistant' ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.03)',
              borderLeft: `3px solid ${msg.role === 'assistant' ? 'var(--primary)' : 'var(--secondary)'}`,
              padding:'0.65rem 0.8rem', borderRadius:'0 8px 8px 0',
              fontSize:'0.83rem', lineHeight:1.5
            }}>
              <div style={{
                fontSize:'0.68rem', fontWeight:700, marginBottom:'0.2rem',
                color: msg.role === 'assistant' ? 'var(--primary)' : 'var(--secondary)'
              }}>
                {msg.role === 'assistant' ? 'AI INTERVIEWER' : candidate.member.name.toUpperCase()}
              </div>
              <div style={{ color:'var(--text-main)' }}>{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div style={{
              display:'flex', alignItems:'center', gap:'0.4rem',
              fontSize:'0.8rem', color:'var(--text-muted)',
              padding:'0.5rem 0.8rem'
            }}>
              <Sparkles size={13} className="pulse-dot"/> AI generating response...
            </div>
          )}
        </div>

        {/* Topics covered */}
        {meta?.topicsCovered?.length > 0 && (
          <div style={{ marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Modules Covered
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
              {meta.topicsCovered.map((t, i) => (
                <span key={i} style={{
                  display:'flex', alignItems:'center', gap:'0.25rem',
                  fontSize:'0.69rem', background:'rgba(56,189,248,0.08)',
                  color:'var(--primary)', padding:'0.2rem 0.5rem', borderRadius:'4px'
                }}>
                  <CheckCircle2 size={10}/> {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text response fallback input */}
        <form onSubmit={handleManualSubmit} style={{ marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:'1px solid var(--border-subtle)', display:'flex', gap:'0.4rem', flexShrink:0 }}>
          <input
            type="text"
            placeholder="Type your response here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            style={{
              flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-subtle)',
              borderRadius:'8px', padding:'0.4rem 0.75rem', color:'var(--text-main)',
              fontSize:'0.8rem', outline:'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            style={{
              background:'var(--primary)', border:'none', borderRadius:'8px',
              padding:'0.4rem 0.85rem', color:'#fff', fontWeight:600,
              fontSize:'0.78rem', cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !inputText.trim() ? 0.5 : 1
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

