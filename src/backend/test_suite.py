import os
import json
import pytest
from datetime import timedelta
from fastapi.testclient import TestClient

from main import app
from database import Base, engine, SessionLocal
from models import User, Officer, Department, Ward, Complaint
from api.deps import get_password_hash, verify_password, create_access_token
from services.ai_service import calculate_haversine_distance, detect_semantic_duplicate

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Ensure departments exist
    if not db.query(Department).first():
        db.add(Department(name="Roads & Highways"))
        db.add(Department(name="Street Lighting"))
        db.add(Department(name="Water Supply"))
        db.commit()
    db.close()

# TEST 1: Password Hashing & Verification Security
def test_password_hashing_security():
    password = "SecurePassword123!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert "$" in hashed
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

# TEST 2: JWT Creation, Expiration & Tampering
def test_jwt_token_validation():
    token = create_access_token(data={"sub": "9876543210", "role": "citizen"})
    assert token is not None

    # Test expired token
    expired_token = create_access_token(data={"sub": "9876543210", "role": "citizen"}, expires_delta=timedelta(seconds=-10))
    res = client.get("/admin/dashboard", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code in [401, 403]

    # Test tampered token
    tampered_token = token[:-5] + "XXXXX"
    res2 = client.get("/admin/dashboard", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res2.status_code in [401, 403]

# TEST 3: Citizen → Officer Forbidden Role Access (HTTP 403)
def test_citizen_forbidden_from_officer_admin_apis():
    citizen_token = create_access_token(data={"sub": "9876543210", "role": "citizen"})
    res = client.get("/admin/dashboard", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]

# TEST 4: Haversine 200m Geographic Proximity Formula
def test_haversine_200m_radius():
    # RS Puram Centroid vs point 100 meters away
    lat1, lng1 = 11.0115, 76.9515
    lat2, lng2 = 11.0120, 76.9518 # ~80 meters away
    lat3, lng3 = 11.0250, 76.9700 # ~1800 meters away (outside 200m)

    dist_near = calculate_haversine_distance(lat1, lng1, lat2, lng2)
    dist_far = calculate_haversine_distance(lat1, lng1, lat3, lng3)

    assert dist_near <= 200.0
    assert dist_far > 200.0

# TEST 5: AI Duplicate Cases (200m Radius + Semantic Match)
def test_ai_duplicate_200m_cases():
    nearby_complaints = [
        {
            "id": 1,
            "category": "Street Lights",
            "description": "Street light is not working on main street",
            "lat": 11.0115,
            "lng": 76.9515,
            "street": "RS Puram",
            "vote_count": 3
        }
    ]

    # Case A: Same issue within 200m -> DUPLICATE
    res_dup = detect_semantic_duplicate("Broken street lamp dark at night", 11.0118, 76.9517, nearby_complaints)
    assert res_dup["is_duplicate"] is True

    # Case B: Outside 200m -> NOT DUPLICATE
    res_far = detect_semantic_duplicate("Broken street lamp dark at night", 11.0300, 76.9700, nearby_complaints)
    assert res_far["is_duplicate"] is False
    assert "200m" in res_far["reason"]

    # Case C: Different issue within 200m -> NOT DUPLICATE
    res_diff = detect_semantic_duplicate("Road is flooded with water", 11.0118, 76.9517, nearby_complaints)
    assert res_diff["is_duplicate"] is False

# TEST 6: Mandatory Map Pin Validation (HTTP 400 when coordinates missing)
def test_map_pin_coordinates_required():
    token = create_access_token(data={"sub": "9876543210", "role": "citizen"})
    form_data = {
        "name": "Test User",
        "street": "RS Puram",
        "description": "Test complaint",
        "mobile_number": "9876543210",
        "communication_address": "Door 1, RS Puram",
        "category": "Street Lights",
        "gender": "Male",
        "email": "test@example.com",
        "ward_id": 1,
        "location_lat": 0.0, # Missing pin
        "location_lng": 0.0
    }
    res = client.post("/complaints/create", data=form_data, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "coordinates are required" in res.json()["detail"]

# TEST 7: Mandatory Dispatch & Response Field Validation
def test_mandatory_dispatch_response_fields():
    officer_token = create_access_token(data={"sub": "9876543211", "role": "ward_officer"})
    
    # Reject empty whitespace action_plan
    res = client.post(
        "/admin/complaints/1/respond",
        json={"action_plan": "   "},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 400
    assert "action plan is required" in res.json()["detail"]

if __name__ == "__main__":
    pytest.main(["-v", __file__])
