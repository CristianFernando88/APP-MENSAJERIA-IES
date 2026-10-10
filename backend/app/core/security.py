"""security.py — Hashear contraseñas y crear/leer tokens JWT."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()


# CONFIGURACIÓN

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "60"))



# CONTRASEÑAS

def hashear_password(password: str) -> str:
    """Convierte '1234' en '$2b$12$Kx...' (irreversible)."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verificar_password(password: str, password_hash: str) -> bool:
    """Compara la contraseña escrita con el hash guardado."""
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except (ValueError, TypeError):
        return False



# TOKENS JWT

def crear_token(usuario_id: int) -> str:
    """Genera un JWT firmado con el id del usuario."""
    expira = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    payload = {
        "sub": str(usuario_id),
        "exp": expira,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token(token: str) -> dict:
    """Verifica la firma y devuelve el payload. Lanza excepción si es inválido."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])