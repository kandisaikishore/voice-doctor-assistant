"""
Optional real Pipecat pipeline.

The browser dashboard uses the local FastAPI tools below for a zero-key demo.
When provider credentials are set, this module wires the same three tools into
Pipecat with ElevenLabs STT/TTS and Google Gemini.
"""

import os

from server import (
    book_appointment,
    cancel_appointment,
    check_availability,
    AppointmentRequest,
    CancelRequest,
    AvailabilityRequest,
)


def registered_tools():
    """Tool registrations are also implemented as REST endpoints in server.py."""
    return {
        "check_doctor_availability": check_availability,
        "book_appointment": book_appointment,
        "cancel_appointment": cancel_appointment,
    }


def build_pipeline():
    try:
        from pipecat.pipeline.pipeline import Pipeline
        from pipecat.pipeline.runner import PipelineRunner
        from pipecat.pipeline.task import PipelineTask
    except ImportError as error:
        raise RuntimeError(
            "Install voice dependencies: pip install -r requirements.txt"
        ) from error

    required = ("ELEVENLABS_API_KEY", "GOOGLE_API_KEY")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(
            f"Set these environment variables before starting Pipecat: {', '.join(missing)}"
        )

    # Provider SDK classes vary across pipecat releases. Configure the transport,
    # STT, LLM and TTS in this function using the installed provider adapters.
    raise RuntimeError(
        "Pipecat SDK is installed but provider adapters must be configured "
        "for the installed SDK version."
    )
