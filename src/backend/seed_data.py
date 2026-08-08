import json
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import Base, Ward, Department

# Coimbatore Wards Boundaries (GeoJSON Polygons for RS Puram, Gandhipuram, Peelamedu)
RS_PURAM_GEOJSON = json.dumps({
    "type": "Polygon",
    "coordinates": [[
        [76.9450, 11.0050],
        [76.9580, 11.0050],
        [76.9580, 11.0180],
        [76.9450, 11.0180],
        [76.9450, 11.0050]
    ]]
})

GANDHIPURAM_GEOJSON = json.dumps({
    "type": "Polygon",
    "coordinates": [[
        [76.9600, 11.0150],
        [76.9750, 11.0150],
        [76.9750, 11.0280],
        [76.9600, 11.0280],
        [76.9600, 11.0150]
    ]]
})

PEELAMEDU_GEOJSON = json.dumps({
    "type": "Polygon",
    "coordinates": [[
        [77.0000, 11.0200],
        [77.0200, 11.0200],
        [77.0200, 11.0350],
        [77.0000, 11.0350],
        [77.0000, 11.0200]
    ]]
})

def seed_db():
    """
    Initializes PostgreSQL tables and seeds essential municipal metadata (Wards & Departments).
    No dummy citizen accounts or test entries.
    """
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Seed Official Municipal Departments
    departments = ["Roads & Highways", "Water Supply", "Sanitation", "Street Lighting", "Electricity", "Drainage"]
    for dept_name in departments:
        if not db.query(Department).filter(Department.name == dept_name).first():
            db.add(Department(name=dept_name))
    db.commit()

    # Seed Initial Coimbatore Pilot Wards
    wards_data = [
        {"ward_number": "Ward 1", "name": "RS Puram", "geojson_boundary": RS_PURAM_GEOJSON, "centroid_lat": 11.0115, "centroid_lng": 76.9515},
        {"ward_number": "Ward 2", "name": "Gandhipuram", "geojson_boundary": GANDHIPURAM_GEOJSON, "centroid_lat": 11.0215, "centroid_lng": 76.9675},
        {"ward_number": "Ward 3", "name": "Peelamedu", "geojson_boundary": PEELAMEDU_GEOJSON, "centroid_lat": 11.0275, "centroid_lng": 77.0100},
    ]

    for w_data in wards_data:
        if not db.query(Ward).filter(Ward.ward_number == w_data["ward_number"]).first():
            db.add(Ward(**w_data))
    db.commit()
    db.close()

def reset_and_seed_db():
    Base.metadata.drop_all(bind=engine)
    seed_db()

if __name__ == "__main__":
    seed_db()
