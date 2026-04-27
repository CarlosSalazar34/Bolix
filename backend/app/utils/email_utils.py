import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_reset_email(to_email: str, reset_link: str):
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    if not email_user or not email_password:
        print("Error: EMAIL_USER or EMAIL_PASSWORD not set in environment.")
        return False

    subject = "Recuperación de contraseña - Bolix"
    
    # HTML Body
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; padding: 30px; border-radius: 20px; border: 1px solid #27272a;">
            <h1 style="color: #10b981; text-align: center;">Bolix</h1>
            <p style="font-size: 16px; color: #a1a1aa;">Hola,</p>
            <p style="font-size: 16px; color: #a1a1aa;">Hemos recibido una solicitud para restablecer tu contraseña en Bolix. Si no fuiste tú, puedes ignorar este correo.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background-color: #10b981; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold;">Restablecer Contraseña</a>
            </div>
            <p style="font-size: 14px; color: #71717a; text-align: center;">O copia y pega este enlace en tu navegador:</p>
            <p style="font-size: 14px; color: #3b82f6; text-align: center; word-break: break-all;">{reset_link}</p>
            <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;">
            <p style="font-size: 12px; color: #52525b; text-align: center;">Bolix - Tu asistente financiero</p>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart()
    msg['From'] = f"Bolix <{email_user}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html, 'html'))

    try:
        # Usamos SMTP de Gmail (puerto 587 con STARTTLS o 465 con SSL)
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(email_user, email_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error al enviar correo: {e}")
        return False
