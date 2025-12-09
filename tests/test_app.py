import sys
import pathlib

import pytest
from fastapi.testclient import TestClient

# Ensure the `src` directory is importable
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from app import app, activities

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Basic expected key
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # Verify participant present
    res2 = client.get("/activities")
    participants = res2.json()[activity]["participants"]
    assert email in participants

    # Unregister
    res3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res3.status_code == 200
    assert "Unregistered" in res3.json().get("message", "")

    # Verify participant removed
    res4 = client.get("/activities")
    participants2 = res4.json()[activity]["participants"]
    assert email not in participants2


def test_unregister_missing():
    activity = "Chess Club"
    email = "nonexistent@example.com"
    # Ensure absent
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 404
