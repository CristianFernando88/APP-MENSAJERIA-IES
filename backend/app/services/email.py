import os
import smtplib
import ssl
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


def enviar_credenciales(destinatario: str, nombre_usuario: str, password_temporal: str):
    mensaje = EmailMessage()
    mensaje["Subject"] = "Bienvenido a IES Connect"
    mensaje["From"] = f"{os.getenv('EMAIL_FROM_NAME', 'IES Connect')} <{os.getenv('EMAIL_USER')}>"
    mensaje["To"] = destinatario

    enlace = os.getenv("FRONTEND_URL", "http://localhost:5173")

    mensaje.set_content(f"""
Hola {nombre_usuario},

Tu cuenta de IES Connect fue creada correctamente.

Tus datos de acceso son:

Usuario: {nombre_usuario}
Contraseña temporal: {password_temporal}

Ingresá a la plataforma:
{enlace}

Por seguridad, deberás cambiar tu contraseña al iniciar sesión por primera vez.

Saludos,
Equipo IES Connect
""")

    contexto = ssl.create_default_context()

    with smtplib.SMTP(os.getenv("EMAIL_HOST"), int(os.getenv("EMAIL_PORT", "587"))) as servidor:
        servidor.starttls(context=contexto)
        servidor.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
        servidor.send_message(mensaje)