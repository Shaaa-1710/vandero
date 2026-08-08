from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime, timedelta

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Officer(Base):
    __tablename__ = "officers"
    id = Column(Integer, primary_key=True, index=True)
    mobile_number = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    name = Column(String)
    email = Column(String, nullable=True)
    role = Column(String) # 'ward_officer', 'department_officer', 'higher_officer'
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)

class Ward(Base):
    __tablename__ = "wards"
    id = Column(Integer, primary_key=True, index=True)
    ward_number = Column(String, unique=True)
    name = Column(String)
    geojson_boundary = Column(Text)
    centroid_lat = Column(Float)
    centroid_lng = Column(Float)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    assigned_officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String)
    mobile_number = Column(String)
    email = Column(String)
    communication_address = Column(String)
    gender = Column(String)
    street = Column(String)
    landmark = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    category = Column(String)
    description = Column(Text)
    
    location_lat = Column(Float)
    location_lng = Column(Float)
    photo_url = Column(String, nullable=True)
    
    status = Column(String, default="Open")
    vote_count = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    escalation_due_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=14))
    
    planned_inspection_date = Column(DateTime, nullable=True)
    planned_start_date = Column(DateTime, nullable=True)
    planned_fix_date = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

class ComplaintVote(Base):
    __tablename__ = "complaint_votes"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class ComplaintEscalation(Base):
    __tablename__ = "complaint_escalations"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    reason = Column(String)
    escalated_to_role = Column(String, default="higher_officer")
    created_at = Column(DateTime, default=datetime.utcnow)

class OfficerPerformanceFlag(Base):
    __tablename__ = "officer_performance_flags"
    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("officers.id"))
    black_mark_count = Column(Integer, default=0)
    overdue_count = Column(Integer, default=0)
    escalated_count = Column(Integer, default=0)
