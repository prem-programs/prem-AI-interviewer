import io
import os
import wave
import math
import struct

class TTSService:
    def __init__(self):
        self.tts = None
        self._gtts_available = None
        self._pyttsx3_available = None
        self._init_pocket_tts()

    def _init_pocket_tts(self):
        # Memory-Optimized Cloud Guard: Default ENABLE_POCKET_TTS to "false" to prevent PyTorch HuggingFace OOM 'Killed' crashes.
        # Set ENABLE_POCKET_TTS=true in environment if high RAM (4GB+) and local PyTorch is desired.
        enable_pocket = os.getenv("ENABLE_POCKET_TTS", "false").lower() in ("true", "1", "yes")
        if not enable_pocket:
            return

        try:
            from pocket_tts import TTSModel
            print("[TTS] Initializing Pocket TTS neural model with INT8 quantization...")
            self.tts = TTSModel.load_model(language="english", quantize=True)
            self.voice_cache = {}
            try:
                self.voice_cache["alba"] = self.tts.get_state_for_audio_prompt("alba")
                self.default_voice_state = self.voice_cache["alba"]
                print("[TTS] Pocket TTS model & default voice ('alba') initialized successfully!")
            except Exception as ve:
                print(f"[TTS] Default voice state load notice: {ve}")
                self.default_voice_state = {}
        except Exception as e:
            print(f"[TTS] Pocket TTS init notice: {e}. Real-voice gTTS / Web Speech fallback active.")

    def synthesize_wav(self, text: str, voice: str = None, voice_path: str = None) -> bytes:
        """
        Synthesizes text into WAV/MP3 bytes using Pocket TTS if loaded, else real-voice gTTS fallback generator.
        Returns b"" if no real TTS engine is available so caller can fallback to Web Speech API.
        """
        if self.tts is not None:
            try:
                voice_state = getattr(self, 'default_voice_state', {})
                if voice and voice.strip():
                    voice_key = voice.strip().lower()
                    if not hasattr(self, 'voice_cache'):
                        self.voice_cache = {}
                    if voice_key in self.voice_cache:
                        voice_state = self.voice_cache[voice_key]
                    else:
                        try:
                            if hasattr(self.tts, 'get_state_for_audio_prompt'):
                                voice_state = self.tts.get_state_for_audio_prompt(voice_key)
                                self.voice_cache[voice_key] = voice_state
                        except Exception as ve:
                            print(f"[TTS] Voice '{voice_key}' load notice: {ve}")

                if voice_path and os.path.exists(voice_path):
                    try:
                        if hasattr(self.tts, 'get_state_for_audio_prompt'):
                            voice_state = self.tts.get_state_for_audio_prompt(voice_path)
                    except Exception as ve:
                        print(f"[TTS] Custom voice prompt fallback: {ve}")

                audio_tensor = None
                if hasattr(self.tts, 'generate_audio'):
                    audio_tensor = self.tts.generate_audio(voice_state, text)
                elif hasattr(self.tts, 'synthesize'):
                    audio_tensor = self.tts.synthesize(text, voice=voice)

                if audio_tensor is not None:
                    if hasattr(audio_tensor, 'detach'):
                        audio_tensor = audio_tensor.detach().cpu()
                    if hasattr(audio_tensor, 'numpy'):
                        import numpy as np
                        import scipy.io.wavfile as wavfile
                        arr = audio_tensor.numpy()
                        if arr.ndim > 1:
                            arr = arr.squeeze()
                        arr_int16 = (np.clip(arr, -1.0, 1.0) * 32767).astype(np.int16)
                        buf = io.BytesIO()
                        wavfile.write(buf, getattr(self.tts, 'sample_rate', 24000), arr_int16)
                        return buf.getvalue()
            except Exception as e:
                print(f"[TTS] Pocket TTS synthesis notice: {e}")

        return self._generate_fallback_wav(text)

    def synthesize_pcm_chunks(self, text: str, voice_path: str = None, chunk_size: int = 4096):
        """
        Yields PCM audio data chunks for WebSocket streaming.
        """
        wav_bytes = self.synthesize_wav(text, voice_path=voice_path)
        if not wav_bytes:
            return
        pcm_data = wav_bytes[44:] if len(wav_bytes) > 44 else wav_bytes
        for i in range(0, len(pcm_data), chunk_size):
            yield pcm_data[i:i + chunk_size]

    def _generate_fallback_wav(self, text: str) -> bytes:
        """
        Fallback voice synthesizer using gTTS (Google Text-To-Speech) or pyttsx3.
        Returns b"" if no real speech library is installed, enabling client Web Speech API fallback.
        """
        # Primary fallback: gTTS (Google Text-To-Speech)
        if self._gtts_available is not False:
            try:
                from gtts import gTTS
                tts = gTTS(text=text, lang='en')
                buf = io.BytesIO()
                tts.write_to_fp(buf)
                audio_bytes = buf.getvalue()
                if audio_bytes and len(audio_bytes) > 100:
                    self._gtts_available = True
                    return audio_bytes
            except ModuleNotFoundError:
                if self._gtts_available is None:
                    print("[TTS] gTTS package not found in Python environment. Client Web Speech API fallback ready.")
                self._gtts_available = False
            except Exception as ge:
                print(f"[TTS] gTTS synthesis notice: {ge}")

        # Secondary fallback: pyttsx3 (SAPI5 / NSSpeech)
        if self._pyttsx3_available is not False:
            try:
                import pyttsx3
                import tempfile
                engine = pyttsx3.init()
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tf:
                    temp_filename = tf.name
                engine.save_to_file(text, temp_filename)
                engine.runAndWait()
                with open(temp_filename, "rb") as f:
                    audio_bytes = f.read()
                try:
                    os.unlink(temp_filename)
                except Exception:
                    pass
                if audio_bytes and len(audio_bytes) > 44:
                    self._pyttsx3_available = True
                    return audio_bytes
            except ModuleNotFoundError:
                self._pyttsx3_available = False
            except Exception as pe:
                print(f"[TTS] pyttsx3 synthesis notice: {pe}")
                self._pyttsx3_available = False

        # Return empty bytes if no backend TTS library is available
        # so frontend Web Speech API (window.speechSynthesis) takes over
        return b""

tts_service = TTSService()

