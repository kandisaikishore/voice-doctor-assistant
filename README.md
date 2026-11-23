# Careline — Voice Doctor Appointment Assistant

A professional React dashboard and local FastAPI voice-agent backend for booking and cancelling doctor appointments by phone number.

## Features

- Voice calls using browser Speech Recognition and Speech Synthesis
- Live call transcript and call timer
- Doctor, speciality, and available-slot directory
- SQLite-backed booking and cancellation data
- Required availability, booking, and cancellation tools
- Optional Pipecat, ElevenLabs, and Google Gemini pipeline

## Run locally

Prerequisites:

- Node.js 20+
- Python 3.11+

Terminal 1:

```powershell
python -m pip install -r requirements.txt
python server.py
```

Terminal 2:

```powershell
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

Chrome or Edge is recommended for browser voice input.

## Try the booking flow

1. Click **Try call**.
2. Speak or type: "I want to book with Dr. Elena Chen."
3. Choose a slot, for example: "Book 11:00 AM."
4. Say a 10-digit phone number.
5. The agent repeats the number and asks for confirmation.
6. Say "Yes" to confirm.

The dashboard updates the appointment list after confirmation.

To cancel, say "Cancel my appointment", provide the phone number, and confirm.

## Provider configuration

Copy `.env.example` to `.env` and add credentials for the optional real provider pipeline:

- ElevenLabs API key and voice ID
- Google Gemini API key

The assignment demo works without API keys using browser STT/TTS and the local FastAPI tool backend.
`pipecat_agent.py` describes the Pipecat STT → LLM → TTS pipeline and registers the same availability, booking, and cancellation tools.

## Pipeline

Caller audio enters a real-time Pipecat pipeline, passes through ElevenLabs speech-to-text, then a Google Gemini LLM with registered function tools. Tool results are persisted in SQLite and returned to Gemini. ElevenLabs text-to-speech converts the response to caller audio. Browser Speech Recognition/Synthesis provides the zero-key fallback demonstrated in the dashboard.
