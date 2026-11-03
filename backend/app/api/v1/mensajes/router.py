import json

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.db import get_db, SessionLocal 
from app.core.security import decodificar_token
from app.core.deps import get_usuario_actual
from app.core.ws_manager import manager  # Importamos el manager global
from . import repository as repo
from .schemas import MensajeCreate, MensajeUpdate, MensajeResponse

router = APIRouter(prefix="/mensajes", tags=["Mensajes"])

# ==========================================
# 1. ENDPOINTS REST
# ==========================================

@router.get("/", response_model=list[MensajeResponse])
def listar(
    canal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    resultado = repo.list_mensajes(db)
    if canal_id is not None:
        resultado = [m for m in resultado if m.canal_id == canal_id]
    return resultado

@router.get("/{mensaje_id}", response_model=MensajeResponse)
def obtener(
    mensaje_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    mensaje = repo.get_by_id(db, mensaje_id)
    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    return mensaje

@router.post("/", response_model=MensajeResponse, status_code=status.HTTP_201_CREATED)
def crear(
    data: MensajeCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    ok, error = repo.ensure_usuario(db, data.usuario_id)
    if not ok:
        raise HTTPException(status_code=400, detail=error)
    ok, error = repo.ensure_canal(db, data.canal_id)
    if not ok:
        raise HTTPException(status_code=400, detail=error)
    return repo.create(db, data)

@router.put("/{mensaje_id}", response_model=MensajeResponse)
def actualizar(
    mensaje_id: int,
    data: MensajeUpdate,
    usuario_id: int = Query(..., description="ID del usuario que modifica el mensaje"),
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    mensaje = repo.get_by_id(db, mensaje_id)
    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    if mensaje.usuario_id != usuario_id:
        raise HTTPException(status_code=403, detail="Solo el autor puede editar el mensaje")
    return repo.update(db, mensaje_id, data)

@router.delete("/{mensaje_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    mensaje_id: int,
    usuario_id: int = Query(..., description="ID del usuario que elimina el mensaje"),
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    mensaje = repo.get_by_id(db, mensaje_id)
    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    if mensaje.usuario_id != usuario_id:
        raise HTTPException(status_code=403, detail="Solo el autor puede eliminar el mensaje")
    repo.delete(db, mensaje_id)
    return None

# ==========================================
# 2. WEBSOCKET (Solo para Canales)
# ==========================================

@router.websocket("/ws/canal/{canal_id}")
async def websocket_canal(
    websocket: WebSocket,
    canal_id: int,
    token: str | None = Query(default=None),
):
    try:
        payload = decodificar_token(token) if token else None
        usuario_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        await websocket.close(code=1008)
        return

    await manager.connect_canal(websocket, canal_id)
    db = SessionLocal()
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            mensaje_data = MensajeCreate(
                contenido=data["contenido"],
                usuario_id=usuario_id,
                canal_id=canal_id
            )
            nuevo_mensaje = repo.create(db, mensaje_data)
            
            mensaje_dict = {
                "id_mensaje": nuevo_mensaje.id_mensaje,
                "contenido": nuevo_mensaje.contenido,
                "usuario_id": nuevo_mensaje.usuario_id,
                "canal_id": nuevo_mensaje.canal_id,
                "fecha_envio": nuevo_mensaje.fecha_envio.isoformat(),
                "editado": nuevo_mensaje.editado
            }
            await manager.broadcast_canal(mensaje_dict, canal_id)
            
    except WebSocketDisconnect:
        manager.disconnect_canal(websocket, canal_id)
    finally:
        db.close()