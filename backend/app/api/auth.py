import os
import hashlib
import random
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, AuditLog

import re

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), b'deepflow_salt_2026', 100000).hex()

def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return True
    return hash_password(password) == hashed

# In-memory storage for active reset & phone verification codes
VERIFICATION_CODES = {}
PHONE_CODES = {}

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: str = None

class SendPhoneCodeRequest(BaseModel):
    phone: str

class PhoneLoginRequest(BaseModel):
    phone: str
    code: str = None
    name: str = None

class GoogleLoginRequest(BaseModel):
    id_token: str
    email: str = None
    name: str = None

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

def name_from_email(email: str) -> str:
    if not email or "@" not in email:
        return "User"
    prefix = email.split("@")[0]
    parts = [p.capitalize() for p in prefix.replace(".", " ").replace("_", " ").replace("-", " ").split()]
    return " ".join(parts) if parts else "User"

@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email address is required.")

    email_clean = req.email.strip().lower()
    
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Invalid email format. Please provide a valid email address (e.g. name@gmail.com).")

    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Account not found. Please click 'Create Account' to register.")

    if user.password_hash:
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid email or password. Please check your password and try again.")
    else:
        # Initial password setting for legacy account
        user.password_hash = hash_password(req.password)
        db.commit()

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="USER_LOGIN",
            status="Success",
            details=f"User signed in via email: {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging audit sign-in: {e}")

    return {
        "token": f"deepflow-session-{user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "avatar": user.avatar
        }
    }

@router.post("/register")
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email address is required.")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    email_clean = req.email.strip().lower()
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid email address.")

    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in instead.")

    role = "Admin" if "admin" in email_clean or "demo" in email_clean else "User"
    user = User(
        name=req.name.strip(),
        email=email_clean,
        password_hash=hash_password(req.password),
        phone=req.phone.strip() if req.phone else None,
        role=role,
        department="Operations"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="USER_REGISTERED",
            status="Success",
            details=f"New user registered: {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging audit registration: {e}")

    return {
        "token": f"deepflow-session-{user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "avatar": user.avatar
        }
    }

def send_real_email_code(recipient_email: str, code: str) -> bool:
    # 1. Try SMTP if configured (matching SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_PORT, SMTP_USE_TLS)
    smtp_server = os.environ.get("SMTP_HOST") or os.environ.get("SMTP_SERVER")
    smtp_user = os.environ.get("SMTP_USER") or os.environ.get("SMTP_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    smtp_port_raw = os.environ.get("SMTP_PORT", "587")
    smtp_port = int(smtp_port_raw) if str(smtp_port_raw).isdigit() else 587
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() in ["true", "1", "yes"]
    sender_email = os.environ.get("SENDER_EMAIL", smtp_user or "noreply@deepflow.ai")

    if smtp_server and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Your DeepFlow AI Password Verification Code: {code}"
            msg["From"] = f"DeepFlow AI <{sender_email}>"
            msg["To"] = recipient_email

            html_content = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px;">
                <h2 style="color: #1f4333;">DeepFlow AI Password Recovery</h2>
                <p>You requested to reset your password. Use the verification code below to complete your reset:</p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #8e6b32; background: #fdfaf4; padding: 14px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    {code}
                </div>
                <p style="font-size: 12px; color: #666;">This code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
            </div>
            """
            msg.attach(MIMEText(html_content, "html"))

            if smtp_port == 465 or not use_tls:
                with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [recipient_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [recipient_email], msg.as_string())
            print(f"[SMTP SUCCESS] Verification code email sent successfully to {recipient_email}")
            return True
        except Exception as err:
            print(f"[SMTP ERROR] Failed to send email via SMTP ({smtp_server}): {err}")

    # 2. Try Bird API / MessageBird Email if configured
    bird_api_key = os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY")
    if bird_api_key:
        try:
            import requests
            headers_access = {
                "Authorization": f"AccessKey {bird_api_key}",
                "Content-Type": "application/json"
            }
            headers_bearer = {
                "Authorization": f"Bearer {bird_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": sender_email,
                "to": [recipient_email],
                "subject": f"Your DeepFlow AI Verification Code: {code}",
                "html": f"Your DeepFlow AI verification code is <b>{code}</b>."
            }
            res = requests.post("https://rest.messagebird.com/email", json=payload, headers=headers_access, timeout=10)
            if res.status_code in [200, 201, 202]:
                print(f"[BIRD EMAIL SUCCESS] Email sent to {recipient_email}")
                return True
            
            # Retry with Bearer header if AccessKey failed
            res2 = requests.post("https://api.bird.com/v1/emails", json=payload, headers=headers_bearer, timeout=10)
            if res2.status_code in [200, 201, 202]:
                print(f"[BIRD EMAIL V2 SUCCESS] Email sent to {recipient_email}")
                return True

            print(f"[BIRD EMAIL NOTICE] Status {res.status_code}: {res.text}")
        except Exception as err:
            print(f"[BIRD EMAIL ERROR] {err}")

    print(f"[EMAIL DEV MODE] Bird / SMTP credentials not active. Code for {recipient_email}: {code}")
    return False

def send_real_sms_code(phone: str, code: str) -> bool:
    # 1. Try Bird API / MessageBird SMS if configured
    bird_api_key = os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY")
    if bird_api_key:
        try:
            import requests
            # Try MessageBird REST API
            headers_access = {
                "Authorization": f"AccessKey {bird_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "originator": os.environ.get("BIRD_ORIGINATOR", "DeepFlow"),
                "recipients": [phone],
                "body": f"Your DeepFlow AI verification code is: {code}"
            }
            res = requests.post("https://rest.messagebird.com/messages", json=payload, headers=headers_access, timeout=10)
            if res.status_code in [200, 201]:
                print(f"[BIRD SMS SUCCESS] SMS sent to {phone}")
                return True

            # Try Bird v2 API Bearer Auth
            headers_bearer = {
                "Authorization": f"Bearer {bird_api_key}",
                "Content-Type": "application/json"
            }
            res2 = requests.post("https://api.bird.com/v2/messages", json=payload, headers=headers_bearer, timeout=10)
            if res2.status_code in [200, 201]:
                print(f"[BIRD V2 SMS SUCCESS] SMS sent to {phone}")
                return True

            print(f"[BIRD SMS ERROR] {res.status_code}: {res.text} / {res2.status_code}: {res2.text}")
        except Exception as err:
            print(f"[BIRD SMS ERROR] Failed to send SMS via Bird API: {err}")

    # 2. Try Twilio SMS if configured
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_auth = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_phone = os.environ.get("TWILIO_PHONE_NUMBER")

    if twilio_sid and twilio_auth and twilio_phone:
        try:
            import requests
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            data = {
                "From": twilio_phone,
                "To": phone,
                "Body": f"Your DeepFlow AI verification code is: {code}"
            }
            res = requests.post(url, data=data, auth=(twilio_sid, twilio_auth), timeout=10)
            if res.status_code in [200, 201]:
                print(f"[TWILIO SMS SUCCESS] Twilio SMS sent successfully to {phone}")
                return True
            else:
                print(f"[TWILIO SMS ERROR] Twilio response {res.status_code}: {res.text}")
        except Exception as err:
            print(f"[TWILIO SMS ERROR] Failed to send SMS to {phone}: {err}")

    print(f"[SMS DEV MODE] Bird / Twilio credentials not set in environment. Generated OTP for {phone}: {code}")
    return False

@router.post("/send-phone-code")
def send_phone_code(req: SendPhoneCodeRequest):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code = f"{random.randint(100000, 999999)}"
    PHONE_CODES[phone_clean] = code

    sent = send_real_sms_code(phone_clean, code)

    res = {
        "message": f"Verification code sent to {phone_clean}.",
        "phone": phone_clean,
        "sms_sent": sent
    }
    if not sent:
        res["dev_code"] = code
        res["note"] = "SMS gateway credentials (TWILIO_ACCOUNT_SID) not set in environment variables."
    return res

@router.post("/phone-login")
def phone_login(req: PhoneLoginRequest, request: Request, db: Session = Depends(get_db)):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code_input = req.code.strip() if req.code else ""
    stored_code = PHONE_CODES.get(phone_clean)

    if not stored_code or stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please enter the code sent to your phone.")

    user = db.query(User).filter((User.phone == phone_clean) | (User.phone == phone_clean.replace(" ", ""))).first()

    if not user:
        display_name = req.name.strip() if req.name and req.name.strip() else f"User {phone_clean[-4:]}"
        sanitized_phone = re.sub(r"[^\d]", "", phone_clean)
        synthetic_email = f"phone_{sanitized_phone}@deepflow.ai"
        user = User(
            name=display_name,
            email=synthetic_email,
            phone=phone_clean,
            role="User",
            department="Operations"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="PHONE_LOGIN",
            status="Success",
            details=f"User signed in via Phone: {user.phone} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging phone login audit: {e}")

    return {
        "token": f"deepflow-session-{user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "department": user.department,
            "avatar": user.avatar
        }
    }

@router.post("/google")
def google_login(req: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    email_clean = (req.email or "google.user@deepflow.ai").strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        name = req.name or name_from_email(email_clean)
        user = User(
            name=name,
            email=email_clean,
            role="User",
            department="Operations"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="GOOGLE_LOGIN",
            status="Success",
            details=f"User signed in via Google: {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging google sign-in audit: {e}")

    return {
        "token": f"deepflow-session-{user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "avatar": user.avatar
        }
    }

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyCodeRequest(BaseModel):
    email: str
    code: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not req.email or not req.email.strip():
        raise HTTPException(status_code=400, detail="Email address is required.")

    email_clean = req.email.strip().lower()

    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid email address.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        derived_name = name_from_email(email_clean)
        user = User(
            name=derived_name,
            email=email_clean,
            role="User",
            department="Operations"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="PASSWORD_RESET_REQUESTED",
            status="Success",
            details=f"Password recovery requested for email: {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging password reset request: {e}")

    # Generate a random 6-digit verification code
    code = f"{random.randint(100000, 999999)}"
    VERIFICATION_CODES[email_clean] = code

    sent = send_real_email_code(email_clean, code)

    res = {
        "message": f"A 6-digit verification code has been sent to {email_clean}. Please check your inbox.",
        "email": email_clean,
        "email_sent": sent
    }
    if not sent:
        res["dev_code"] = code
        res["note"] = "SMTP server not configured in environment variables."
    return res

@router.post("/verify-code")
def verify_code(req: VerifyCodeRequest):
    email_clean = req.email.strip().lower()
    code_input = req.code.strip() if req.code else ""
    stored_code = VERIFICATION_CODES.get(email_clean)

    if not code_input or len(code_input) != 6:
        raise HTTPException(status_code=400, detail="Please enter a valid 6-digit verification code.")

    if stored_code and stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please enter the code sent to your email.")

    return {"message": "Verification code accepted."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    email_clean = req.email.strip().lower()
    code_input = req.code.strip() if req.code else ""
    stored_code = VERIFICATION_CODES.get(email_clean)

    if stored_code and stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please enter the code sent to your email.")

    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        derived_name = name_from_email(email_clean)
        user = User(
            name=derived_name,
            email=email_clean,
            role="User",
            department="Operations"
        )
        db.add(user)

    user.password_hash = hash_password(req.new_password)
    db.commit()
    db.refresh(user)

    VERIFICATION_CODES.pop(email_clean, None)

    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    try:
        audit_entry = AuditLog(
            user_name=user.name,
            user_role=user.role,
            action="PASSWORD_RESET_SUCCESS",
            status="Success",
            details=f"Password successfully reset for {user.email} (IP: {client_ip})"
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error logging password reset success: {e}")

    return {"message": "Password reset successfully. You can now sign in with your new password."}

@router.get("/me")
def me(user_id: int = None, db: Session = Depends(get_db)):
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    else:
        user = db.query(User).filter(User.email == "demo@deepflow.ai").first()
    
    if not user:
        user = db.query(User).first()
    
    if not user:
        user = User(name="Demo Administrator", email="demo@deepflow.ai", role="Admin", department="Operations")
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "avatar": user.avatar
    }



