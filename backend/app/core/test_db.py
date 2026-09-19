from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"URL de conexión: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("¡Conexión exitosa a PostgreSQL!")
except Exception as e:
    print(f"Error de conexión: {e}")