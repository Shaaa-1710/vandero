from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Officer
from schemas import UserRegister, LoginRequest, Token
from api.deps import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_mobile = db.query(User).filter(User.mobile_number == user_data.mobile_number).first()
    if existing_mobile:
        raise HTTPException(status_code=400, detail="Mobile number is already registered")
        
    if user_data.username:
        existing_username = db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username is already taken")

    hashed_pwd = get_password_hash(user_data.password)
    user = User(
        mobile_number=user_data.mobile_number,
        username=user_data.username,
        hashed_password=hashed_pwd,
        name=user_data.name,
        email=user_data.email
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.mobile_number, "role": "citizen"}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "citizen",
        "mobile_number": user.mobile_number,
        "username": user.username
    }

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    if login_data.role == "citizen":
        user = db.query(User).filter(User.mobile_number == login_data.mobile_number).first()
    else:
        user = db.query(Officer).filter(Officer.mobile_number == login_data.mobile_number).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect mobile number or password")

    role = login_data.role if login_data.role == "citizen" else user.role
    access_token = create_access_token(
        data={"sub": user.mobile_number, "role": role}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "mobile_number": user.mobile_number,
        "username": user.username
    }
