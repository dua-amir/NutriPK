import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_reset_email(to_email, reset_link):
    # Gmail SMTP setup
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    sender_email = 'duaamir4211@gmail.com'  # <-- Replace with your Gmail
    sender_password = 'hawkjfwdztfsjwmm'   # <-- Replace with your Gmail App Password

    subject = 'NutriPK Password Reset'
    body = f"""
    Hello,

    You requested a password reset for your NutriPK account.
    Click the link below to reset your password:

    {reset_link}

    If you did not request this, please ignore this email.
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_otp_email(to_email, otp_code):
    # Gmail SMTP setup (reuse same creds)
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    sender_email = 'duaamir4211@gmail.com'  # <-- Replace with your Gmail
    sender_password = 'hawkjfwdztfsjwmm'   # <-- Replace with your Gmail App Password

    subject = 'Your NutriPK One-Time Password (OTP)'
    body = f"""
    Hello,

    Use the following One-Time Password (OTP) to verify your account or reset your password:

    {otp_code}

    This code expires in 10 minutes. If you did not request this, please ignore this email.
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send OTP email: {e}")
        return False