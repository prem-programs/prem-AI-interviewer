import React, { useState } from 'react';
import { Mic, CheckCircle2, AlertTriangle, Play, X, Sparkles, Volume2, Brain, Zap } from 'lucide-react';
import { POCKET_TTS_VOICES } from '../hooks/useVoicePipeline';
import { API_BASE_URL } from '../config';

export default function VoiceSetup({ isOpen, onClose, onConfirm }) {
  const [previewing, setPreviewing] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('alba');

  if (!isOpen) return null;

  const isBrowserSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: "Hello! I am your AI technical interviewer powered by Pocket TTS. Let's begin your evaluation.",
          voice: selectedVoiceId
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 100) {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.onended = () => setPreviewing(false);
          audio.onerror = () => setPreviewing(false);
          await audio.play();
          return;
        }
      }
      setPreviewing(false);
    } catch (e) {
      console.warn('[VoiceSetup] Pocket TTS preview error:', e);
      setPreviewing(false);
    }
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(9,13,22,0.88)',
      backdropFilter:'blur(10px)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem'
    }}>
      <div style={{
        background:'#0f172a', border:'1px solid var(--border-subtle)',
        borderRadius:'18px', maxWidth:'480px', width:'100%',
        padding:'1.75rem 2rem', boxShadow:'0 24px 60px rgba(0,0,0,0.65)',
        color:'#f8fafc', position:'relative'
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position:'absolute', top:'1rem', right:'1rem',
          background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer'
        }}>
          <X size={20}/>
        </button>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem', marginBottom:'1.25rem' }}>
          <div style={{
            background:'linear-gradient(135deg,#38bdf8,#6366f1)',
            padding:'0.65rem', borderRadius:'12px', display:'flex'
          }}>
            <Mic size={24} color="#fff"/>
          </div>
          <div>
            <h3 style={{ fontSize:'1.15rem', fontWeight:700, margin:0 }}>Voice Mode Setup</h3>
            <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', margin:0 }}>
              Kyutai Pocket TTS Speech-to-Speech AI
            </p>
          </div>
        </div>

        {/* Browser Warning */}
        {!isBrowserSupported && (
          <div style={{
            background:'rgba(244,63,94,0.12)', border:'1px solid rgba(244,63,94,0.35)',
            padding:'0.7rem 0.9rem', borderRadius:'10px', fontSize:'0.81rem',
            color:'#fda4af', marginBottom:'1rem', display:'flex', alignItems:'flex-start', gap:'0.5rem'
          }}>
            <AlertTriangle size={16} style={{ flexShrink:0, marginTop:'1px' }}/>
            <span>Speech recognition requires Chrome or Edge. Text response input is available as fallback.</span>
          </div>
        )}

        {/* How it works */}
        <div style={{
          background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)',
          borderRadius:'10px', padding:'0.9rem 1rem', marginBottom:'1.25rem',
          fontSize:'0.82rem', lineHeight:1.7, color:'var(--text-muted)'
        }}>
          <div style={{ fontWeight:600, color:'var(--primary)', marginBottom:'0.4rem' }}>How it works</div>
          <Mic size={14} style={{ display:'inline', verticalAlign:'-2px', marginRight:6, color:'#38bdf8' }}/> <strong style={{color:'#f8fafc'}}>Tap the mic</strong> → speak your answer<br/>
          <Brain size={14} style={{ display:'inline', verticalAlign:'-2px', marginRight:6, color:'#a855f7' }}/> AI evaluates &amp; generates the technical question<br/>
          <Volume2 size={14} style={{ display:'inline', verticalAlign:'-2px', marginRight:6, color:'#38bdf8' }}/> <strong style={{color:'#f8fafc'}}>Pocket TTS speaks</strong> the question aloud
        </div>

        {/* ── Pocket TTS Voice Selection ── */}
        <div style={{
          background:'rgba(30,41,59,0.6)', border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'12px', padding:'1rem', marginBottom:'1rem'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.65rem' }}>
            <div>
              <div style={{ fontWeight:600, fontSize:'0.9rem' }}>Pocket TTS Neural Models</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>PyTorch Kyutai TTS engine on CPU</div>
            </div>
            <button
              onClick={handlePreview}
              disabled={previewing}
              style={{
                background:'rgba(56,189,248,0.12)', border:'1px solid rgba(56,189,248,0.3)',
                color:'#38bdf8', padding:'0.35rem 0.75rem',
                borderRadius:'6px', cursor:'pointer', fontSize:'0.76rem', fontWeight:600,
                display:'flex', alignItems:'center', gap:'0.3rem'
              }}>
              {previewing ? <><Sparkles size={12}/> Synthesizing...</> : <><Play size={12}/> Preview</>}
            </button>
          </div>

          {/* Voice dropdown */}
          <select
            value={selectedVoiceId}
            onChange={e => setSelectedVoiceId(e.target.value)}
            style={{
              width:'100%', background:'rgba(15,23,42,0.9)',
              border:'1px solid var(--border-subtle)', color:'#f8fafc',
              borderRadius:'8px', padding:'0.55rem 0.75rem',
              fontSize:'0.82rem', cursor:'pointer', outline:'none',
              appearance:'auto'
            }}
          >
            {POCKET_TTS_VOICES.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Voice quality tag */}
          <div style={{
            marginTop:'0.5rem', fontSize:'0.72rem', color:'var(--text-muted)',
            display:'flex', alignItems:'center', gap:'0.35rem'
          }}>
            <Zap size={11} color="#f59e0b"/>
            PyTorch Pocket TTS model (24kHz WAV, zero external web APIs)
          </div>
        </div>


        {/* Mic permission note */}
        <div style={{
          display:'flex', alignItems:'center', gap:'0.5rem',
          fontSize:'0.78rem', color:'var(--text-muted)',
          background:'rgba(255,255,255,0.03)', borderRadius:'8px',
          padding:'0.55rem 0.75rem', marginBottom:'1.25rem'
        }}>
          <CheckCircle2 size={14} style={{ color:'var(--accent-emerald)' }}/>
          Your browser will ask for microphone permission when you start speaking.
        </div>

        {/* Enter button */}
        <button
          onClick={() => onConfirm(selectedVoiceId)}
          style={{
            width:'100%', background:'linear-gradient(135deg,var(--primary),var(--secondary))',
            color:'#fff', border:'none', padding:'0.8rem',
            borderRadius:'10px', fontWeight:700, fontSize:'0.95rem',
            cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', gap:'0.5rem',
            boxShadow:'0 4px 20px rgba(56,189,248,0.3)',
            transition:'opacity 0.2s'
          }}>
          <Sparkles size={16}/> Enter Voice Mode
        </button>

      </div>
    </div>
  );
}
