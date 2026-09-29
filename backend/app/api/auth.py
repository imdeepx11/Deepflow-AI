import os
import hashlib
import random
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
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
    import sys
    # Debug: log which email providers are configured
    bird_key_present = bool(os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY"))
    resend_key_present = bool(os.environ.get("RESEND_API_KEY"))
    smtp_present = bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_PASSWORD"))
    print(f"[EMAIL DEBUG] Attempting to send OTP to {recipient_email} | Bird={bird_key_present} Resend={resend_key_present} SMTP={smtp_present}", flush=True)

    # 0. Try HTTP Email APIs if keys exist (Resend, Brevo, SendGrid, Bird)
    resend_api_key = os.environ.get("RESEND_API_KEY")
    if resend_api_key:
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                # Always use Resend's shared sender — avoids 403 domain verification errors.
                "from": "NEXORA AI <onboarding@resend.dev>",
                "to": [recipient_email],
                "subject": f"Your NEXORA AI Verification Code: {code}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px;">
                    <h2 style="color: #1f4333;">NEXORA AI Password Recovery</h2>
                    <p>You requested to reset your password. Use the verification code below to complete your reset:</p>
                    <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #8e6b32; background: #fdfaf4; padding: 14px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        {code}
                    </div>
                    <p style="font-size: 12px; color: #666;">This code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
                </div>
                """
            }
            res = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201, 202]:
                print(f"[RESEND EMAIL SUCCESS] Verification code sent to {recipient_email}", flush=True)
                return True
            else:
                print(f"[RESEND EMAIL NOTICE] {res.status_code}: {res.text}", flush=True)
        except Exception as err:
            print(f"[RESEND EMAIL ERROR] {err}", flush=True)

    # 1. Try Bird API (bird.com) Email if configured
    bird_api_key = os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY")
    sender_email = os.environ.get("SENDER_EMAIL") or os.environ.get("SMTP_USER") or ""

    if bird_api_key:
        try:
            import requests

            html_body = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px;">
                <h2 style="color: #1f4333;">NEXORA AI Password Recovery</h2>
                <p>You requested to reset your password. Use the verification code below:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8e6b32; background: #fdfaf4; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    {code}
                </div>
                <p style="font-size: 12px; color: #666;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
            </div>
            """

            # Bird.com current API — regional base URL
            # bk_eu1_... keys → EU region, everything else → US region
            if bird_api_key.startswith("bk_eu1_"):
                base_url = "https://eu1.platform.bird.com"
            else:
                base_url = "https://us1.platform.bird.com"

            bird_url = f"{base_url}/v1/email/messages"

            # Bird shared test sender — works without domain verification.
            # To use your own domain, verify it in the Bird dashboard first,
            # then set SENDER_EMAIL to your verified address.
            from_email = "onboarding@messagebird.dev"

            bird_payload = {
                "from": {
                    "email": from_email,
                    "name": "NEXORA AI"
                },
                "to": [
                    {"email": recipient_email}
                ],
                "subject": f"Your NEXORA AI Verification Code: {code}",
                "html": html_body,
                "text": f"Your NEXORA AI verification code is: {code}. This code is valid for 15 minutes.",
                "category": "transactional"
            }

            bird_headers = {
                "Authorization": f"Bearer {bird_api_key}",
                "Content-Type": "application/json"
            }

            print(f"[BIRD EMAIL] Sending to {recipient_email} via {bird_url} from {from_email}", flush=True)
            res = requests.post(bird_url, json=bird_payload, headers=bird_headers, timeout=10)
            print(f"[BIRD EMAIL] Response {res.status_code}: {res.text[:500]}", flush=True)

            if res.status_code in [200, 201, 202]:
                print(f"[BIRD EMAIL SUCCESS] Email sent to {recipient_email}", flush=True)
                return True
            else:
                print(f"[BIRD EMAIL FAILED] Status {res.status_code}: {res.text}", flush=True)

        except Exception as err:
            print(f"[BIRD EMAIL ERROR] {err}", flush=True)

    # 2. Try SMTP if configured
    smtp_server = os.environ.get("SMTP_HOST") or os.environ.get("SMTP_SERVER")
    smtp_user = os.environ.get("SMTP_USER") or os.environ.get("SMTP_USERNAME") or os.environ.get("SENDER_EMAIL")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    smtp_port_raw = os.environ.get("SMTP_PORT", "587")
    smtp_port = int(smtp_port_raw) if str(smtp_port_raw).isdigit() else 587
    print(f"[SMTP DEBUG] server={smtp_server} user={smtp_user} pass_set={bool(smtp_pass)}", flush=True)

    if smtp_server and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Your NEXORA AI Password Verification Code: {code}"
            msg["From"] = smtp_user
            msg["To"] = recipient_email

            html_content = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px;">
                <h2 style="color: #1f4333;">NEXORA AI Password Recovery</h2>
                <p>You requested to reset your password. Use the verification code below to complete your reset:</p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #8e6b32; background: #fdfaf4; padding: 14px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    {code}
                </div>
                <p style="font-size: 12px; color: #666;">This code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
            </div>
            """
            msg.attach(MIMEText(html_content, "html"))

            # Attempt STARTTLS on 587
            try:
                with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, [recipient_email], msg.as_string())
                print(f"[SMTP STARTTLS SUCCESS] Verification code email sent to {recipient_email}")
                return True
            except smtplib.SMTPAuthenticationError as auth_err:
                print(f"[SMTP AUTH ERROR] Google/SMTP rejected login for {smtp_user}: {auth_err}. If using Gmail, a 16-character App Password (myaccount.google.com/apppasswords) is required instead of personal password.")
            except Exception as tls_err:
                print(f"[SMTP STARTTLS NOTICE] {tls_err}. Retrying with SSL on port 465...")

            # Attempt SSL on 465 fallback
            try:
                ssl_port = 465 if smtp_port != 465 else smtp_port
                with smtplib.SMTP_SSL(smtp_server, ssl_port, timeout=10) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, [recipient_email], msg.as_string())
                print(f"[SMTP SSL SUCCESS] Verification code email sent to {recipient_email}")
                return True
            except smtplib.SMTPAuthenticationError as auth_err:
                print(f"[SMTP AUTH ERROR] Google/SMTP rejected login for {smtp_user}: {auth_err}. App Password required.")
            except Exception as ssl_err:
                print(f"[SMTP SSL ERROR] {ssl_err}")

        except Exception as err:
            print(f"[SMTP GENERAL ERROR] Failed to send email via SMTP ({smtp_server}:{smtp_port}): {err}")

    print(f"[EMAIL DEV MODE] All email dispatchers completed. Code for {recipient_email}: {code}")
    return False

def send_real_sms_code(phone: str, code: str) -> bool:
    # 1. Try Bird API / MessageBird SMS if configured
    bird_api_key = os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY")
    if bird_api_key:
        try:
            import requests
            headers_access = {
                "Authorization": f"AccessKey {bird_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "originator": os.environ.get("BIRD_ORIGINATOR", "NEXORA"),
                "recipients": [phone],
                "body": f"Your NEXORA AI verification code is: {code}"
            }
            res = requests.post("https://rest.messagebird.com/messages", json=payload, headers=headers_access, timeout=5)
            if res.status_code in [200, 201]:
                print(f"[BIRD SMS SUCCESS] SMS sent to {phone}")
                return True

            headers_bearer = {
                "Authorization": f"Bearer {bird_api_key}",
                "Content-Type": "application/json"
            }
            res2 = requests.post("https://api.bird.com/v2/messages", json=payload, headers=headers_bearer, timeout=5)
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
                "Body": f"Your NEXORA AI verification code is: {code}"
            }
            res = requests.post(url, data=data, auth=(twilio_sid, twilio_auth), timeout=5)
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
def send_phone_code(req: SendPhoneCodeRequest, background_tasks: BackgroundTasks):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code = f"{random.randint(100000, 999999)}"
    PHONE_CODES[phone_clean] = code

    background_tasks.add_task(send_real_sms_code, phone_clean, code)

    return {
        "message": f"Verification code sent to {phone_clean}. Please check your SMS.",
        "phone": phone_clean
    }

@router.post("/phone-login")
def phone_login(req: PhoneLoginRequest, request: Request, db: Session = Depends(get_db)):
    phone_clean = req.phone.strip() if req.phone else ""
    if not phone_clean or len(phone_clean) < 7:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code_input = req.code.strip() if req.code else ""
    stored_code = PHONE_CODES.get(phone_clean)

    if not stored_code:
        raise HTTPException(status_code=400, detail="Verification code expired or not found. Please request a new code.")
    if stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please enter the code sent to your phone.")

    user = db.query(User).filter((User.phone == phone_clean) | (User.phone == phone_clean.replace(" ", ""))).first()

    if not user:
        display_name = req.name.strip() if req.name and req.name.strip() else f"User {phone_clean[-4:]}"
        sanitized_phone = re.sub(r"[^\d]", "", phone_clean)
        synthetic_email = f"phone_{sanitized_phone}@nexora.ai"
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
    email_clean = (req.email or "google.user@nexora.ai").strip().lower()
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
def forgot_password(req: ForgotPasswordRequest, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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

    # Send email — runs synchronously so logs appear immediately in Render
    send_real_email_code(email_clean, code)

    return {
        "message": f"A 6-digit verification code has been sent to {email_clean}. Please check your inbox and spam folder.",
        "email": email_clean
    }

@router.post("/verify-code")
def verify_code(req: VerifyCodeRequest):
    email_clean = req.email.strip().lower()
    code_input = req.code.strip() if req.code else ""
    stored_code = VERIFICATION_CODES.get(email_clean)

    if not code_input or len(code_input) != 6:
        raise HTTPException(status_code=400, detail="Please enter a valid 6-digit verification code.")

    if not stored_code:
        raise HTTPException(status_code=400, detail="Verification code expired or not found. Please request a new code.")
    if stored_code != code_input:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please enter the code sent to your email.")

    return {"message": "Verification code accepted."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    if not req.new_password or len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must contain at least 6 characters.")

    email_clean = req.email.strip().lower()
    code_input = req.code.strip() if req.code else ""
    stored_code = VERIFICATION_CODES.get(email_clean)

    if not stored_code:
        raise HTTPException(status_code=400, detail="Verification code expired or not found. Please request a new code.")
    if stored_code != code_input:
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
        user = db.query(User).filter(User.email == "demo@nexora.ai").first()
    
    if not user:
        user = db.query(User).first()
    
    if not user:
        user = User(name="Demo Administrator", email="demo@nexora.ai", role="Admin", department="Operations")
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



