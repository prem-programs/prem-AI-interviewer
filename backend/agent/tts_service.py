import io
import os
import wave
import math
import struct

class TTSService:
    def __init__(self):
        self.tts = None
        self._init_pocket_tts()

    def _init_pocket_tts(self):
        # On memory-limited cloud hosts (Render 512MB limit), skip heavy PyTorch Pocket TTS pre-loading unless explicitly enabled
        enable_pocket = os.getenv("ENABLE_POCKET_TTS", "false").lower() in ("true", "1", "yes")
        if not enable_pocket:
            print("[TTS] Cloud/Memory-optimized mode: Web Browser TTS active (Memory < 70MB).")
            return

        try:
            from pocket_tts import TTSModel
            print("[TTS] Initializing Pocket TTS model with INT8 quantization...")
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
            print(f"[TTS] Pocket TTS init notice: {e}. Web browser TTS / fallback mode active.")

    def synthesize_wav(self, text: str, voice: str = None, voice_path: str = None) -> bytes:
        """
        Synthesizes text into WAV bytes using Pocket TTS if loaded, else fallback generator.
        """
        if self.tts is not None:
            try:
                voice_state = self.default_voice_state
                if voice and voice.strip():
                    voice_key = voice.strip().lower()
                    if not hasattr(self, 'voice_cache'):
                        self.voice_cache = {}
                    if voice_key in self.voice_cache:
                        voice_state = self.voice_cache[voice_key]
                    else:
                        try:
                            voice_state = self.tts.get_state_for_audio_prompt(voice_key)
                            self.voice_cache[voice_key] = voice_state
                        except Exception as ve:
                            print(f"[TTS] Voice '{voice_key}' load notice: {ve}")

                if voice_path and os.path.exists(voice_path):
                    try:
                        voice_state = self.tts.get_state_for_audio_prompt(voice_path)
                    except Exception as ve:
                        print(f"[TTS] Custom voice prompt fallback: {ve}")



                if hasattr(self.tts, 'generate_audio'):
                    audio_tensor = self.tts.generate_audio(voice_state, text)
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
        wav_bytes = self.synthesize_wav(text, voice_path)
        # WAV header is 44 bytes; skip it for raw 16-bit PCM streaming
        pcm_data = wav_bytes[44:] if len(wav_bytes) > 44 else wav_bytes
        for i in range(0, len(pcm_data), chunk_size):
            yield pcm_data[i:i + chunk_size]

    def _generate_fallback_wav(self, text: str) -> bytes:
        sample_rate = 24000
        words = text.split() if text else ["Hello"]
        duration_per_word = 0.28
        total_duration = max(1.0, len(words) * duration_per_word)
        num_samples = int(sample_rate * total_duration)

        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)  # 16-bit PCM
            wav_file.setframerate(sample_rate)

            samples = []
            base_freq = 180.0
            for i in range(num_samples):
                t = i / sample_rate
                word_idx = min(int(t / duration_per_word), len(words) - 1)
                word = words[word_idx] if words else ""
                char_mod = sum(ord(c) for c in word) % 40 if word else 0
                freq = base_freq + math.sin(t * 10) * 15 + char_mod

                val = (0.6 * math.sin(2 * math.pi * freq * t) +
                       0.25 * math.sin(4 * math.pi * freq * t))
                envelope = min(1.0, t * 10) * min(1.0, (total_duration - t) * 10)
                sample = int(val * envelope * 14000)
                samples.append(struct.pack('<h', max(-32768, min(32767, sample))))

            wav_file.writeframes(b''.join(samples))

        return buf.getvalue()

tts_service = TTSService()
