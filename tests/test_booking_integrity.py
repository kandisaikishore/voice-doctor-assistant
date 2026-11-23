import pytest
from fastapi.testclient import TestClient

import server


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(server, "DB_PATH", tmp_path / "appointments.sqlite3")
    server.pending_actions.clear()
    server.init_db()
    with TestClient(server.app) as test_client:
        yield test_client
    server.pending_actions.clear()


def test_booking_is_removed_from_availability_for_same_date(client):
    payload = {
        "doctor_id": "dr-chen",
        "phone": "1234567890",
        "time": "09:30 AM",
        "date": "2026-11-24",
    }

    created = client.post("/api/book", json=payload)
    assert created.status_code == 200
    assert created.json()["date"] == "2026-11-24"

    availability = client.post(
        "/api/check",
        json={"doctor": "dr-chen", "date": "2026-11-24"},
    )
    assert availability.status_code == 200
    assert "09:30 AM" not in availability.json()["slots"]


def test_same_slot_can_be_booked_on_a_different_date(client):
    base = {
        "doctor_id": "dr-chen",
        "phone": "1234567890",
        "time": "09:30 AM",
    }
    first = client.post("/api/book", json={**base, "date": "2026-11-24"})
    second = client.post("/api/book", json={**base, "date": "2026-11-25"})

    assert first.status_code == 200
    assert second.status_code == 200


def test_duplicate_confirmed_booking_is_rejected(client):
    payload = {
        "doctor_id": "dr-chen",
        "phone": "1234567890",
        "time": "09:30 AM",
        "date": "2026-11-24",
    }
    assert client.post("/api/book", json=payload).status_code == 200
    duplicate = client.post("/api/book", json=payload)

    assert duplicate.status_code == 409


def test_invalid_date_is_rejected(client):
    response = client.post(
        "/api/check",
        json={"doctor": "dr-chen", "date": "not-a-date"},
    )

    assert response.status_code == 400


def test_chat_pending_actions_are_isolated_by_session(client):
    first = client.post(
        "/api/chat",
        json={
            "message": "Book Dr. Elena Chen at 09:30 AM",
            "session_id": "caller-session-one",
        },
    )
    second = client.post(
        "/api/chat",
        json={"message": "1234567890", "session_id": "caller-session-two"},
    )
    first_phone = client.post(
        "/api/chat",
        json={"message": "1234567890", "session_id": "caller-session-one"},
    )

    assert "phone number" in first.json()["reply"].lower()
    assert "doctor and time" in second.json()["reply"].lower()
    assert "confirm" in first_phone.json()["reply"].lower()
    assert server.pending_actions["caller-session-one"]["action"] == "book"
    assert "caller-session-two" not in server.pending_actions
