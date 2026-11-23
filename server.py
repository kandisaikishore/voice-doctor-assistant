import re
import sqlite3
import uuid
from contextlib import closing
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

DB_PATH = Path(__file__).with_name("appointments.db")

DOCTORS = [
    {"id": "dr-chen", "name": "Dr. Elena Chen", "speciality": "Cardiology", "initials": "EC", "color": "#7e9e8b"},
    {"id": "dr-patel", "name": "Dr. Arjun Patel", "speciality": "General Medicine", "initials": "AP", "color": "#bd8d66"},
    {"id": "dr-williams", "name": "Dr. Sophia Williams", "speciality": "Dermatology", "initials": "SW", "color": "#8294a8"},
]

SLOTS = {
    "dr-chen": ["09:30 AM", "11:00 AM", "02:30 PM"],
    "dr-patel": ["10:00 AM", "01:15 PM", "04:00 PM"],
    "dr-williams": ["09:00 AM", "12:30 PM", "03:45 PM"],
}

app = FastAPI(title="Careline Appointment API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

pending_actions = {}


def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with closing(db()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS appointments (
                id TEXT PRIMARY KEY,
                doctor_id TEXT NOT NULL,
                doctor_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                status TEXT NOT NULL
            )
            """
        )
        connection.commit()


init_db()


def appointment_rows():
    with closing(db()) as connection:
        rows = connection.execute(
            "SELECT * FROM appointments WHERE status != 'cancelled' ORDER BY time"
        ).fetchall()
    return [dict(row) for row in rows]


def find_doctor(text):
    lowered = text.lower()
    for doctor in DOCTORS:
        if doctor["id"] in lowered or doctor["name"].lower().split()[-1] in lowered or doctor["speciality"].lower() in lowered:
            return doctor
    return None


def phone_from(text):
    matches = re.findall(r"(?<!\d)(?:\d[ -]?){9}\d(?!\d)", text)
    for match in matches:
        digits = re.sub(r"\D", "", match)
        if len(digits) == 11 and digits.startswith("1"):
            digits = digits[1:]
        if len(digits) == 10:
            return digits
    return None


def find_slot(text, doctor_id):
    compact = re.sub(r"\s+", "", text).lower()
    for slot in SLOTS[doctor_id]:
        if re.sub(r"\s+", "", slot).lower() in compact:
            return slot
    return None


@app.get("/api/doctors")
def get_doctors():
    return [
        {**doctor, "slots": SLOTS[doctor["id"]]}
        for doctor in DOCTORS
    ]


@app.get("/api/slots")
def get_slots():
    return [
        {"doctorId": doctor["id"], "doctorName": doctor["name"], "slots": SLOTS[doctor["id"]]}
        for doctor in DOCTORS
    ]


@app.get("/api/appointments")
def get_appointments():
    return appointment_rows()


class AvailabilityRequest(BaseModel):
    doctor: str
    date: str | None = None


@app.post("/api/check")
def check_availability(request: AvailabilityRequest):
    doctor = next((item for item in DOCTORS if item["id"] == request.doctor or item["name"].lower() == request.doctor.lower()), None)
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    return {"doctor": doctor["name"], "slots": SLOTS[doctor["id"]], "date": request.date or "November 24"}


class AppointmentRequest(BaseModel):
    doctor_id: str
    phone: str
    time: str


@app.post("/api/book")
def book_appointment(request: AppointmentRequest):
    doctor = next((item for item in DOCTORS if item["id"] == request.doctor_id), None)
    if not doctor:
        raise HTTPException(404, "Doctor not found")
    phone = re.sub(r"\D", "", request.phone)
    if len(phone) != 10:
        raise HTTPException(400, "A 10-digit phone number is required")
    if request.time not in SLOTS[request.doctor_id]:
        raise HTTPException(400, "That slot is not available")

    with closing(db()) as connection:
        occupied = connection.execute(
            "SELECT id FROM appointments WHERE doctor_id = ? AND time = ? AND status = 'confirmed'",
            (request.doctor_id, request.time),
        ).fetchone()
        if occupied:
            raise HTTPException(409, "That slot was just booked")
        appointment_id = str(uuid.uuid4())[:8]
        connection.execute(
            "INSERT INTO appointments (id, doctor_id, doctor_name, phone, date, time, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (appointment_id, request.doctor_id, doctor["name"], phone, "2026-11-24", request.time, "confirmed"),
        )
        connection.commit()

    row = {"id": appointment_id, "doctorId": request.doctor_id, "doctorName": doctor["name"], "phone": phone, "date": "2026-11-24", "time": request.time, "status": "confirmed"}
    return row


class CancelRequest(BaseModel):
    phone: str
    appointment_id: str | None = None


@app.post("/api/cancel")
def cancel_appointment(request: CancelRequest):
    phone = re.sub(r"\D", "", request.phone)
    with closing(db()) as connection:
        if request.appointment_id:
            row = connection.execute(
                "SELECT * FROM appointments WHERE id = ? AND phone = ? AND status = 'confirmed'",
                (request.appointment_id, phone),
            ).fetchone()
        else:
            row = connection.execute(
                "SELECT * FROM appointments WHERE phone = ? AND status = 'confirmed' ORDER BY time LIMIT 1",
                (phone,),
            ).fetchone()
        if not row:
            raise HTTPException(404, "No appointment found for that phone number")
        connection.execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", (row["id"],))
        connection.commit()
    return {"id": row["id"], "status": "cancelled", "phone": phone}


class ChatRequest(BaseModel):
    message: str


@app.post("/api/chat")
def chat(request: ChatRequest):
    message = request.message.strip()
    lowered = message.lower()
    session_key = "caller"
    phone = phone_from(message)

    pending = pending_actions.get(session_key)
    if pending:
        if pending["action"] == "await_phone_cancel":
            if phone:
                pending_actions[session_key] = {"action": "cancel", "phone": phone}
                formatted = f"{phone[:3]}-{phone[3:6]}-{phone[6:]}"
                return {"reply": f"I read your phone number as {formatted}. Is that correct? Please confirm that you want to cancel.", "appointment": None}
            return {"reply": "Please say a 10-digit phone number for the existing appointment.", "appointment": None}

        if pending["action"] == "cancel":
            if re.search(r"\b(yes|confirm|correct|cancel it|go ahead)\b", lowered):
                try:
                    result = cancel_appointment(CancelRequest(phone=pending["phone"]))
                except HTTPException as error:
                    pending_actions.pop(session_key, None)
                    return {"reply": error.detail, "appointment": None}
                pending_actions.pop(session_key, None)
                return {"reply": f"Your appointment is cancelled. I cancelled the visit for phone number ending in {pending['phone'][-4:]}.", "appointment": result}
            pending_actions.pop(session_key, None)
            return {"reply": "No problem. I have not cancelled the appointment.", "appointment": None}

        if pending["action"] == "book":
            if re.search(r"\b(yes|confirm|correct|book it|go ahead)\b", lowered):
                try:
                    result = book_appointment(AppointmentRequest(
                        doctor_id=pending["doctor_id"],
                        phone=pending["phone"],
                        time=pending["time"],
                    ))
                except HTTPException as error:
                    pending_actions.pop(session_key, None)
                    return {"reply": error.detail, "appointment": None}
                pending_actions.pop(session_key, None)
                return {
                    "reply": f"Confirmed. You are booked with {pending['doctor_name']} at {pending['time']} on November 24.",
                    "appointment": result,
                }
            pending_actions.pop(session_key, None)
            return {"reply": "No problem. I did not make the booking.", "appointment": None}

    if "cancel" in lowered:
        if not phone:
            pending_actions[session_key] = {"action": "await_phone_cancel"}
            return {"reply": "I can help cancel that. Please say the 10-digit phone number used for the appointment.", "appointment": None}
        pending_actions[session_key] = {"action": "cancel", "phone": phone}
        formatted = f"{phone[:3]}-{phone[3:6]}-{phone[6:]}"
        return {"reply": f"I read your phone number as {formatted}. Is that correct? If yes, confirm that you want to cancel.", "appointment": None}

    doctor = find_doctor(message)
    if "available" in lowered or "availability" in lowered or "appointment" in lowered or doctor:
        if doctor:
            slots = SLOTS[doctor["id"]]
            slot = find_slot(message, doctor["id"])
            if slot:
                if not phone:
                    pending_actions[session_key] = {"action": "collect_phone", "doctor_id": doctor["id"], "doctor_name": doctor["name"], "time": slot}
                    return {"reply": f"{doctor['name']} has {slot} available. Please say the 10-digit phone number for the booking.", "appointment": None}
                pending_actions[session_key] = {"action": "book", "doctor_id": doctor["id"], "doctor_name": doctor["name"], "time": slot, "phone": phone}
                formatted = f"{phone[:3]}-{phone[3:6]}-{phone[6:]}"
                return {"reply": f"I have {doctor['name']} at {slot}. I read your phone number as {formatted}. Is that correct? Please confirm to book.", "appointment": None}
            return {"reply": f"{doctor['name']} has these times available: {', '.join(slots)}. Which one would you prefer?", "appointment": None}
        return {"reply": "Which doctor or speciality would you like to see? We have Cardiology, General Medicine, and Dermatology.", "appointment": None}

    if phone:
        if pending and pending["action"] == "collect_phone":
            pending["phone"] = phone
            pending["action"] = "book"
            formatted = f"{phone[:3]}-{phone[3:6]}-{phone[6:]}"
            return {"reply": f"I read your phone number as {formatted}. Is that correct? Please confirm to book {pending['doctor_name']} at {pending['time']}.", "appointment": None}
        return {"reply": "Thank you. Please tell me the doctor and time you would like.", "appointment": None}

    return {"reply": "I can check doctor availability, book an appointment, or cancel an existing appointment. What would you like to do?", "appointment": None}


if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
