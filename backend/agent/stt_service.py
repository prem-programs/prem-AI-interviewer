import os
import io
from dotenv import load_dotenv

load_dotenv()

class STTService:
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=api_key)
                print("[STT] Groq Whisper-large-v3 STT engine initialized successfully!")
            except Exception as e:
                print(f"[STT] Groq STT init notice: {e}")

    def transcribe_audio(self, audio_bytes: bytes, filename: str = "recording.webm") -> str:
        """
        Transcribes recorded mic audio bytes to text using Whisper STT engine.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            return ""

        if self.client:
            try:
                audio_file = (filename, audio_bytes)
                transcription = self.client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-large-v3-turbo",
                    response_format="json",
                    temperature=0.0
                )
                text = transcription.text.strip() if hasattr(transcription, 'text') else str(transcription).strip()
                print(f"[STT] Transcribed audio ({len(audio_bytes)} bytes) -> '{text}'")
                return text
            except Exception as e:
                print(f"[STT] Whisper transcription notice: {e}")

        return ""

stt_service = STTService()
