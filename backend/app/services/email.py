import os
import httpx
from dotenv import load_dotenv

load_dotenv()

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def enviar_credenciales(destinatario: str, nombre_usuario: str, password_temporal: str):
    """Envía el correo de bienvenida con credenciales usando la API HTTP de Brevo.

    Se usa la API HTTPS (puerto 443) en lugar de SMTP para evitar el bloqueo de
    puertos 25/465/587 en servicios gratuitos de hosting como Render.
    """
    api_key = os.getenv("BREVO_API_KEY")
    remitente = os.getenv("SENDER_EMAIL")

    if not api_key or not remitente:
        raise RuntimeError(
            "Faltan configurar BREVO_API_KEY o SENDER_EMAIL en el archivo .env."
        )

    enlace = os.getenv("FRONTEND_URL", "http://localhost:5173")

    mensaje = {
        "sender": {"name": "IES Connect", "email": remitente},
        "to": [{"email": destinatario}],
        "subject": "Bienvenido a IES Connect",
        "textContent": f"""
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
""",
    }

    respuesta = httpx.post(
        BREVO_API_URL,
        headers={"api-key": api_key, "content-type": "application/json"},
        json=mensaje,
        timeout=15,
    )
    respuesta.raise_for_status()
