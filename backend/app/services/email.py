import os
import resend
from dotenv import load_dotenv

load_dotenv()


def enviar_credenciales(destinatario: str, nombre_usuario: str, password_temporal: str):
    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise RuntimeError("No está configurada la clave RESEND_API_KEY.")

    resend.api_key = api_key

    enlace = os.getenv("FRONTEND_URL", "http://localhost:5173")

    mensaje = {
        "from": "IES Connect <onboarding@resend.dev>",
        "to": [destinatario],
        "subject": "Bienvenido a IES Connect",
        "text": f"""
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
"""
    }

    resend.Emails.send(mensaje)