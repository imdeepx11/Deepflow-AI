import os
import requests

def send_real_email_code(recipient_email: str, code: str, reset_link: str = None) -> bool:
    """Dispatches password recovery emails via Resend, Bird, SMTP or returns dev mode fallback."""
    bird_key_present = bool(os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY"))
    resend_key_present = bool(os.environ.get("RESEND_API_KEY"))
    smtp_present = bool(os.environ.get("SMTP_HOST") and os.environ.get("SMTP_PASSWORD"))
    print(f"[EMAIL DEBUG] Target: {recipient_email} | Resend={resend_key_present} Bird={bird_key_present} SMTP={smtp_present}", flush=True)

    link_button_html = f"""
    <div style="text-align: center; margin: 24px 0;">
        <a href="{reset_link}" style="background-color: #1f4333; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 24px; font-weight: bold; font-size: 14px; display: inline-block;">
            Reset Your Password Now
        </a>
    </div>
    """ if reset_link else ""

    html_content = f"""
    <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 16px;">
        <h2 style="color: #1f4333; margin-top: 0;">NEXORA AI Password Recovery</h2>
        <p style="color: #4a5568; font-size: 14px;">Click the button below to set a new password directly, or enter your 6-digit verification code:</p>
        {link_button_html}
        <div style="font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #8e6b32; background: #fdfaf4; padding: 14px; text-align: center; border-radius: 10px; margin: 16px 0;">
            {code}
        </div>
        <p style="font-size: 12px; color: #718096;">Valid for 15 minutes.</p>
    </div>
    """

    # 1. Resend API
    resend_api_key = os.environ.get("RESEND_API_KEY")
    if resend_api_key:
        try:
            headers = {"Authorization": f"Bearer {resend_api_key}", "Content-Type": "application/json"}
            payload = {
                "from": "NEXORA AI <onboarding@resend.dev>",
                "to": [recipient_email],
                "subject": "Reset Your NEXORA AI Password",
                "html": html_content
            }
            res = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
            if res.status_code in (200, 201, 202):
                print(f"[RESEND SUCCESS] Sent to {recipient_email}", flush=True)
                return True
        except Exception as err:
            print(f"[RESEND ERROR] {err}", flush=True)

    # 2. Bird API
    bird_api_key = os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY")
    if bird_api_key:
        try:
            base_url = "https://eu1.platform.bird.com" if bird_api_key.startswith("bk_eu1_") else "https://us1.platform.bird.com"
            payload = {
                "from": {"email": "onboarding@messagebird.dev", "name": "NEXORA AI"},
                "to": [{"email": recipient_email}],
                "subject": "Reset Your NEXORA AI Password",
                "html": html_content,
                "text": f"Your NEXORA verification code is: {code}. Link: {reset_link or 'N/A'}"
            }
            res = requests.post(f"{base_url}/v1/email/messages", json=payload, headers={"Authorization": f"Bearer {bird_api_key}", "Content-Type": "application/json"}, timeout=10)
            if res.status_code in (200, 201, 202):
                print(f"[BIRD SUCCESS] Sent to {recipient_email}", flush=True)
                return True
        except Exception as err:
            print(f"[BIRD ERROR] {err}", flush=True)

    # 3. SMTP
    smtp_server = os.environ.get("SMTP_HOST") or os.environ.get("SMTP_SERVER")
    smtp_user = os.environ.get("SMTP_USER") or os.environ.get("SMTP_USERNAME") or os.environ.get("SENDER_EMAIL")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    if smtp_server and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Reset Your NEXORA AI Password"
            msg["From"] = smtp_user
            msg["To"] = recipient_email
            msg.attach(MIMEText(html_content, "html"))
            port = int(os.environ.get("SMTP_PORT", 587))
            with smtplib.SMTP(smtp_server, port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, [recipient_email], msg.as_string())
            print(f"[SMTP SUCCESS] Sent to {recipient_email}")
            return True
        except Exception as err:
            print(f"[SMTP ERROR] {err}")

    print(f"[EMAIL DEV MODE] Code: {code} | Link: {reset_link}")
    return False


def send_real_sms_code(phone: str, code: str) -> bool:
    """Dispatches verification SMS via MessageBird / Twilio or returns dev mode fallback."""
    bird_api_key = os.environ.get("BIRD_API_KEY") or os.environ.get("MESSAGEBIRD_API_KEY")
    if bird_api_key:
        try:
            payload = {
                "originator": os.environ.get("BIRD_ORIGINATOR", "NEXORA"),
                "recipients": [phone],
                "body": f"Your NEXORA AI verification code is: {code}"
            }
            res = requests.post("https://rest.messagebird.com/messages", json=payload, headers={"Authorization": f"AccessKey {bird_api_key}", "Content-Type": "application/json"}, timeout=5)
            if res.status_code in (200, 201):
                return True
        except Exception as err:
            print(f"[BIRD SMS ERROR] {err}")

    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_auth = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_phone = os.environ.get("TWILIO_PHONE_NUMBER")
    if twilio_sid and twilio_auth and twilio_phone:
        try:
            res = requests.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                data={"From": twilio_phone, "To": phone, "Body": f"Your NEXORA AI verification code is: {code}"},
                auth=(twilio_sid, twilio_auth),
                timeout=5
            )
            if res.status_code in (200, 201):
                return True
        except Exception as err:
            print(f"[TWILIO SMS ERROR] {err}")

    print(f"[SMS DEV MODE] OTP for {phone}: {code}")
    return False
