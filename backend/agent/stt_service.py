import os
import io
from dotenv import load_dotenv

def _load_stt_env():
    possible_paths = [
        os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        ".env",
        "backend/.env"
    ]
    for path in possible_paths:
        if os.path.exists(path):
            load_dotenv(path)
    load_dotenv()

_load_stt_env()

class STTService:
    def __init__(self):
        self.groq_client = None
        self.openai_client = None

    def _get_groq_client(self):
        _load_stt_env()
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key and not self.groq_client:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=api_key)
                print("[STT] Groq Whisper STT engine ready.")
            except Exception as e:
                print(f"[STT] Groq STT init notice: {e}")
        return self.groq_client

    def _get_openai_client(self):
        _load_stt_env()
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key and not self.openai_client:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=api_key)
                print("[STT] OpenAI Whisper STT engine ready.")
            except Exception as e:
                print(f"[STT] OpenAI STT init notice: {e}")
        return self.openai_client

    def transcribe_audio(self, audio_bytes: bytes, filename: str = "recording.webm") -> str:
        """
        Transcribes recorded mic audio bytes to text using Whisper STT engine.
        """
        if not audio_bytes or len(audio_bytes) < 300:
            print(f"[STT] Audio payload too small ({len(audio_bytes) if audio_bytes else 0} bytes), skipping transcription.")
            return ""

        groq_client = self._get_groq_client()
        if groq_client:
            # Try Groq whisper-large-v3-turbo model
            for model_name in ["whisper-large-v3-turbo", "whisper-large-v3"]:
                try:
                    audio_file = (filename, audio_bytes)
                    transcription = groq_client.audio.transcriptions.create(
                        file=audio_file,
                        model=model_name,
                        response_format="json",
                        temperature=0.0
                    )
                    text = transcription.text.strip() if hasattr(transcription, 'text') else str(transcription).strip()
                    if text:
                        print(f"[STT] Groq ({model_name}) transcribed ({len(audio_bytes)} bytes) -> '{text}'")
                        return text
                except Exception as e:
                    print(f"[STT] Groq {model_name} notice: {e}")

        openai_client = self._get_openai_client()
        if openai_client:
            try:
                audio_file = (filename, audio_bytes)
                transcription = openai_client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-1",
                    temperature=0.0
                )
                text = transcription.text.strip() if hasattr(transcription, 'text') else str(transcription).strip()
                if text:
                    print(f"[STT] OpenAI Whisper-1 transcribed ({len(audio_bytes)} bytes) -> '{text}'")
                    return text
            except Exception as e:
                print(f"[STT] OpenAI Whisper-1 notice: {e}")

        return ""

stt_service = STTService()

