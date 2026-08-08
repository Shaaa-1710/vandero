from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Complaint, ComplaintEscalation, OfficerPerformanceFlag, Officer
from api.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def officer_dashboard(
    ward_id: Optional[int] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)
    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)

    complaints = query.all()
    now = datetime.utcnow()

    for c in complaints:
        if c.status in ["Open", "In Progress"]:
            if c.escalation_due_at and now > c.escalation_due_at:
                c.status = "Overdue"
                esc = db.query(ComplaintEscalation).filter(ComplaintEscalation.complaint_id == c.id).first()
                if not esc:
                    new_esc = ComplaintEscalation(
                        complaint_id=c.id,
                        reason="14-day SLA Hard Limit Expired Unresolved",
                        escalated_to_role="higher_officer"
                    )
                    db.add(new_esc)
                    
                    if c.assigned_officer_id:
                        flag = db.query(OfficerPerformanceFlag).filter(
                            OfficerPerformanceFlag.officer_id == c.assigned_officer_id
                        ).first()
                        if not flag:
                            flag = OfficerPerformanceFlag(officer_id=c.assigned_officer_id)
                            db.add(flag)
                        flag.black_mark_count += 1
                        flag.escalated_count += 1

    db.commit()

    for c in complaints:
        hours_open = (now - c.created_at).total_seconds() / 3600.0
        overdue_boost = 100 if c.status == "Overdue" else 0
        setattr(c, "rank_score", (c.vote_count * 10) + hours_open + overdue_boost)

    ranked_complaints = sorted(complaints, key=lambda x: getattr(x, "rank_score"), reverse=True)
    return ranked_complaints

@router.post("/complaints/{complaint_id}/update-status")
async def update_complaint_status(
    complaint_id: int,
    status_str: str = Body(..., embed=True),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = status_str
    if status_str == "Resolved":
        complaint.resolved_at = datetime.utcnow()
        
    db.commit()

    return {"message": "Status updated successfully", "status": complaint.status}

@router.post("/complaints/{complaint_id}/set-dates")
def set_planned_dates(
    complaint_id: int,
    planned_inspection_date: Optional[str] = Body(None),
    planned_start_date: Optional[str] = Body(None),
    planned_fix_date: Optional[str] = Body(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if planned_inspection_date:
        complaint.planned_inspection_date = datetime.fromisoformat(planned_inspection_date)
    if planned_start_date:
        complaint.planned_start_date = datetime.fromisoformat(planned_start_date)
    if planned_fix_date:
        complaint.planned_fix_date = datetime.fromisoformat(planned_fix_date)

    db.commit()
    return {"message": "Planned dates updated successfully"}

@router.get("/performance-flags")
def get_performance_flags(db: Session = Depends(get_db)):
    flags = db.query(OfficerPerformanceFlag).all()
    result = []
    for f in flags:
        officer = db.query(Officer).filter(Officer.id == f.officer_id).first()
        result.append({
            "officer_name": officer.name if officer else "Unknown",
            "black_mark_count": f.black_mark_count,
            "overdue_count": f.overdue_count,
            "escalated_count": f.escalated_count
        })
    return result
