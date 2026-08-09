import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export const POCKET_TTS_VOICES = [
  { id: 'alba', name: 'Alba (Female - Standard)' },
  { id: 'marius', name: 'Marius (Male - Deep)' },
  { id: 'cosette', name: 'Cosette (Female - Warm)' },
  { id: 'jean', name: 'Jean (Male - Expressive)' },
  { id: 'anna', name: 'Anna (Female - Professional)' },
  { id: 'vera', name: 'Vera (Female - Clear)' },
  { id: 'fantine', name: 'Fantine (Female - Soft)' },
  { id: 'charles', name: 'Charles (Male - Formal)' },
  { id: 'paul', name: 'Paul (Male - Natural)' },
  { id: 'george', name: 'George (Male - Authoritative)' },
  { id: 'jane', name: 'Jane (Female - Friendly)' },
  { id: 'michael', name: 'Michael (Male - Dynamic)' },
  { id: 'eve', name: 'Eve (Female - Crisp)' }
];

export function useVoicePipeline({ onTranscriptFinal, initialVoice = 'alba' }) {
  const [voiceState, setVoiceState] = useState('IDLE'); // IDLE | LISTENING | PROCESSING | SPEAKING
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported] = useState(true);
  const [availableVoices] = useState(POCKET_TTS_VOICES);
  const [selectedVoiceName, setSelectedVoiceName] = useState(initialVoice);
  const [micVolume, setMicVolume] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // ─── Refs for thread-safe audio state ────────────────────────────────────
  const onTranscriptFinalRef = useRef(onTranscriptFinal);
  const isSpeakingRef        = useRef(false);
  const voiceStateRef        = useRef('IDLE');
  const selectedVoiceRef     = useRef(initialVoice);
  const activeAudioRef       = useRef(null);

  // MediaRecorder & Web Audio refs
  const mediaRecorderRef     = useRef(null);
  const audioChunksRef       = useRef([]);
  const audioContextRef      = useRef(null);
  const analyserRef         = useRef(null);
  const mediaStreamRef       = useRef(null);
  const animFrameRef         = useRef(null);

  // Sync refs on render
  useEffect(() => { onTranscriptFinalRef.current = onTranscriptFinal; });
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { selectedVoiceRef.current = selectedVoiceName; }, [selectedVoiceName]);
  useEffect(() => {
    if (initialVoice) {
      setSelectedVoiceName(initialVoice);
      selectedVoiceRef.current = initialVoice;
    }
  }, [initialVoice]);


  // Clean up audio hardware streams and contexts
  const cleanupAudioHardware = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
    setMicVolume(0);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (_) {}
      activeAudioRef.current = null;
    }
    isSpeakingRef.current    = false;
    cleanupAudioHardware();
    setVoiceState('IDLE');
  }, [cleanupAudioHardware]);

  // ─── Backend Audio STT Transcription Function ────────────────────────────
  const sendAudioBlobForSTT = useCallback(async (blob) => {
    if (!blob || blob.size < 1000) {
      setError('Recording was too short. Please tap mic, speak your technical answer, then tap again to submit.');
      setVoiceState('IDLE');
      cleanupAudioHardware();
      return;
    }

    setVoiceState('PROCESSING');
    cleanupAudioHardware();
    setInterimTranscript('Transcribing audio via Whisper...');

    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');

      const res = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const transcribedText = (data.text || '').trim();
        setInterimTranscript('');
        if (transcribedText) {
          setError(null);
          onTranscriptFinalRef.current?.(transcribedText);
        } else {
          setError('No speech detected in audio. Please speak clearly into your mic or use the text input below.');
          setVoiceState('IDLE');
        }
      } else {
        setError('Server speech transcription failed. Please use text input below.');
        setVoiceState('IDLE');
      }
    } catch (err) {
      console.warn('[STT] Transcribe upload failed:', err);
      setError('Transcription network error. Please use text input below.');
      setVoiceState('IDLE');
    }
  }, [cleanupAudioHardware]);

  // ─── MediaRecorder Mic Start ─────────────────────────────────────────────
  const startListeningFn = useCallback(async () => {
    setError(null);
    setInterimTranscript('');
    audioChunksRef.current = [];
    isSpeakingRef.current = false;
    stopSpeaking();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Microphone is not supported on this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup Web Audio Analyser for micVolume meter
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          if (voiceStateRef.current === 'LISTENING' && analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setMicVolume(Math.min(100, Math.round(avg * 2.2)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          } else {
            setMicVolume(0);
          }
        };
        updateVolume();
      }

      // Create MediaRecorder instance
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/wav')) mimeType = 'audio/wav';
        else mimeType = '';
      }

      const recorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        sendAudioBlobForSTT(audioBlob);
      };

      recorder.start(250);
      setVoiceState('LISTENING');

    } catch (err) {
      console.warn('[STT] getUserMedia error:', err);
      setError(`Microphone permission denied or device unattached (${err.message || 'Access Denied'}). Please check browser settings.`);
      setVoiceState('IDLE');
      cleanupAudioHardware();
    }
  }, [cleanupAudioHardware, sendAudioBlobForSTT, stopSpeaking]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('[STT] recorder stop error:', e);
      }
    } else {
      setVoiceState('IDLE');
      cleanupAudioHardware();
    }
  }, [cleanupAudioHardware]);

  // ─── Pocket TTS Single-Stream High-Speed Synthesizer (Zero Comma/Period Gaps) ──
  const playTTSAudio = useCallback(async (text) => {
    if (!text) return;
    const cleanText = text.replace(/[*_`#]/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    stopSpeaking();

    // Split text into full sentences (never split on commas to prevent inter-phrase delays)
    const wordCount = cleanText.split(/\s+/).length;
    const sentences = wordCount <= 45 
      ? [cleanText] 
      : (cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText]).map(s => s.trim()).filter(Boolean);

    if (sentences.length === 0) return;

    isSpeakingRef.current = true;
    setVoiceState('SPEAKING');

    const voice = selectedVoiceRef.current || 'alba';
    let currentIdx = 0;

    // Helper to fetch WAV audio for a text chunk
    const fetchChunkAudio = async (chunkText) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunkText, voice })
        });
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 100) {
            return URL.createObjectURL(blob);
          }
        }
      } catch (e) {
        console.warn('[TTS] Audio fetch error:', e);
      }
      return null;
    };

    // Pre-fetch chunks in parallel
    const audioUrlPromises = sentences.map(s => fetchChunkAudio(s));

    const playNextSentence = async () => {
      if (currentIdx >= sentences.length || !isSpeakingRef.current) {
        const wasSpeaking = isSpeakingRef.current;
        isSpeakingRef.current = false;
        setVoiceState('IDLE');
        // Auto-start microphone recording for seamless Q&A flow when TTS completes naturally
        if (wasSpeaking) {
          setTimeout(() => {
            startListeningFn();
          }, 300);
        }
        return;
      }


      const idx = currentIdx;
      currentIdx++;

      const audioUrl = await audioUrlPromises[idx];
      if (!audioUrl || !isSpeakingRef.current) {
        playNextSentence();
        return;
      }

      try {
        const audio = new Audio(audioUrl);
        activeAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          playNextSentence();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          playNextSentence();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[TTS] Playback catch notice:', err);
            setAutoplayBlocked(true);
            playNextSentence();
          });
        }
      } catch (err) {
        console.error('[TTS] Play error:', err);
        playNextSentence();
      }
    };

    playNextSentence();
  }, [stopSpeaking]);


  const unlockAudio = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.play().then(() => {
        setAutoplayBlocked(false);
        setVoiceState('SPEAKING');
      }).catch(() => {});
    }
  }, []);

  return {
    voiceState,
    setVoiceState,
    interimTranscript,
    isSupported,
    error,
    availableVoices,
    selectedVoiceName,
    setSelectedVoiceName,
    micVolume,
    autoplayBlocked,
    unlockAudio,
    startListening: startListeningFn,
    stopListening,
    playTTSAudio,
    stopSpeaking,
  };
}
