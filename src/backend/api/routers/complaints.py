import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ComplaintVote, Department, Ward, User
from api.deps import get_current_user
from services.ai_service import detect_semantic_duplicate, validate_photo_with_gemini
from services.cloudinary_service import upload_image

router = APIRouter(prefix="/complaints", tags=["complaints"])

def get_department_for_complaint(category: str, description: str, db: Session) -> Optional[int]:
    """
    Intelligently maps complaint category and description text to official municipal departments.
    """
    text = (category + " " + description).lower()
    
    if any(k in text for k in ["street light", "lighting", "lamp", "electrical", "electricity", "wire", "pole"]):
        dept = db.query(Department).filter(
            Department.name.ilike("%Street Lighting%") | Department.name.ilike("%Electricity%")
        ).first()
        if dept: return dept.id

    if any(k in text for k in ["road", "pothole", "tar", "pavement", "highway", "street"]):
        dept = db.query(Department).filter(Department.name.ilike("%Road%")).first()
        if dept: return dept.id

    if any(k in text for k in ["water", "pipe", "leak", "tap", "supply"]):
        dept = db.query(Department).filter(Department.name.ilike("%Water%")).first()
        if dept: return dept.id

    if any(k in text for k in ["garbage", "trash", "sanitat", "waste", "clean"]):
        dept = db.query(Department).filter(Department.name.ilike("%Sanitat%")).first()
        if dept: return dept.id

    if any(k in text for k in ["drain", "sewage", "gutter", "overflow"]):
        dept = db.query(Department).filter(Department.name.ilike("%Drain%")).first()
        if dept: return dept.id

    # Default fallback lookup
    dept = db.query(Department).filter(Department.name.ilike(f"%{category}%")).first()
    if dept: return dept.id

    # Fallback to first department
    first_dept = db.query(Department).first()
    return first_dept.id if first_dept else None

@router.get("/")
def get_complaints(
    ward_id: Optional[int] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)
    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if department and department != "All":
        dept = db.query(Department).filter(Department.name.ilike(f"%{department}%")).first()
        if dept:
            query = query.filter(Complaint.department_id == dept.id)
        
    now = datetime.utcnow()
    complaints = query.all()
    for c in complaints:
        if c.status in ["Open", "In Progress"] and c.escalation_due_at and now > c.escalation_due_at:
            c.status = "Overdue"
    db.commit()

    # Sort primarily by vote_count descending, then time open
    sorted_complaints = sorted(complaints, key=lambda x: (x.vote_count, x.created_at), reverse=True)
    return sorted_complaints

@router.post("/precheck-duplicate")
def precheck_duplicate(
    ward_id: int,
    category: str,
    db: Session = Depends(get_db)
):
    open_complaints = db.query(Complaint).filter(
        Complaint.ward_id == ward_id,
        Complaint.category == category,
        Complaint.status.in_(["Open", "In Progress", "Overdue"])
    ).all()
    return open_complaints

@router.post("/create")
async def create_complaint(
    name: str = Form(...),
    street: str = Form(...),
    description: str = Form(...),
    mobile_number: str = Form(...),
    communication_address: str = Form(...),
    category: str = Form(...),
    gender: str = Form(...),
    email: str = Form(...),
    ward_id: int = Form(...),
    location_lat: float = Form(...),
    location_lng: float = Form(...),
    pincode: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    open_nearby = db.query(Complaint).filter(
        Complaint.ward_id == ward_id,
        Complaint.status.in_(["Open", "In Progress", "Overdue"])
    ).all()
    
    nearby_list = [
        {"id": c.id, "category": c.category, "description": c.description, "street": c.street}
        for c in open_nearby
    ]
    
    if nearby_list:
        try:
            dup_result = detect_semantic_duplicate(description, nearby_list)
            if dup_result.get("is_duplicate"):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Already reported — please upvote the existing complaint.",
                        "existing_complaint_id": dup_result.get("existing_complaint_id"),
                        "reason": dup_result.get("reason")
                    }
                )
        except ValueError as val_err:
            raise HTTPException(status_code=500, detail=str(val_err))

    photo_url = None
    if photo:
        photo_bytes = await photo.read()
        if len(photo_bytes) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Photo size must be under 2 MB.")
            
        try:
            vision_result = validate_photo_with_gemini(photo_bytes, category, description)
            if not vision_result.get("is_valid"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Photo validation failed: {vision_result.get('reason', 'Image does not match the issue description/category')}"
                )
        except ValueError as val_err:
            raise HTTPException(status_code=500, detail=str(val_err))
            
        photo_url = upload_image(photo_bytes)

    # Intelligently resolve municipal department ID
    dept_id = get_department_for_complaint(category, description, db)

    new_complaint = Complaint(
        ward_id=ward_id,
        department_id=dept_id,
        created_by=current_user.id,
        name=name,
        street=street,
        description=description,
        mobile_number=mobile_number,
        communication_address=communication_address,
        category=category,
        gender=gender,
        email=email,
        location_lat=location_lat,
        location_lng=location_lng,
        pincode=pincode,
        landmark=landmark,
        photo_url=photo_url,
        vote_count=1,
        status="Open",
        escalation_due_at=datetime.utcnow() + timedelta(days=14)
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint

@router.post("/{complaint_id}/upvote")
async def upvote_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    existing_vote = db.query(ComplaintVote).filter(
        ComplaintVote.complaint_id == complaint_id,
        ComplaintVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already upvoted this complaint")
        
    vote = ComplaintVote(complaint_id=complaint_id, user_id=current_user.id)
    db.add(vote)
    
    complaint.vote_count += 1
    db.commit()
    db.refresh(complaint)

    return {"message": "Upvoted successfully", "vote_count": complaint.vote_count}
