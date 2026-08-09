import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

try:
    from backend.agent.tts_service import tts_service
    from backend.agent.stt_service import stt_service
except ModuleNotFoundError:
    from agent.tts_service import tts_service
    from agent.stt_service import stt_service

voice_router = APIRouter()

BASE_DIR = os.path.dirname(__file__)
VOICES_DIR = os.path.join(BASE_DIR, "data", "voices")
os.makedirs(VOICES_DIR, exist_ok=True)

class SynthesizeRequest(BaseModel):
    text: str
    session_id: Optional[str] = None
    voice: Optional[str] = None

@voice_router.post("/api/voice/synthesize")
def synthesize_voice(req: SynthesizeRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text parameter is required")
    
    voice_path = None
    if req.session_id:
        custom_voice = os.path.join(VOICES_DIR, f"{req.session_id}.wav")
        if os.path.exists(custom_voice):
            voice_path = custom_voice

    audio_bytes = tts_service.synthesize_wav(req.text, voice=req.voice, voice_path=voice_path)
    media_type = "audio/wav"
    if audio_bytes.startswith(b'\xff\xfb') or audio_bytes.startswith(b'ID3') or audio_bytes.startswith(b'\xff\xf3') or audio_bytes.startswith(b'\xff\xf2'):
        media_type = "audio/mpeg"

    return Response(content=audio_bytes, media_type=media_type)

@voice_router.post("/api/voice/transcribe")
async def transcribe_audio_file(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="Audio file parameter is required")

    audio_bytes = await file.read()
    filename = file.filename or "recording.webm"
    transcribed_text = stt_service.transcribe_audio(audio_bytes, filename=filename)

    return {
        "status": "ok",
        "text": transcribed_text
    }



@voice_router.post("/api/voice/upload-voice-sample")
async def upload_voice_sample(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    destination = os.path.join(VOICES_DIR, f"{session_id}.wav")
    contents = await file.read()
    with open(destination, "wb") as f:
        f.write(contents)

    return {
        "status": "ok",
        "message": "Voice sample saved successfully",
        "session_id": session_id,
        "path": destination
    }

@voice_router.websocket("/ws/tts")
async def websocket_tts(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = json.loads(raw_data)
                text = payload.get("text", "")
                session_id = payload.get("session_id", None)
            except Exception:
                text = raw_data
                session_id = None

            if not text or not text.strip():
                continue

            voice_path = None
            if session_id:
                custom_voice = os.path.join(VOICES_DIR, f"{session_id}.wav")
                if os.path.exists(custom_voice):
                    voice_path = custom_voice

            for chunk in tts_service.synthesize_pcm_chunks(text, voice_path=voice_path):
                await websocket.send_bytes(chunk)
                
            # Send an EOF string marker to signal completion of stream for this text turn
            await websocket.send_text("EOF")

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket TTS error: {e}")
