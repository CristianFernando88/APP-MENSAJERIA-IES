import json

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.db import get_db, SessionLocal
from app.core.security import decodificar_token
from app.core.deps import get_usuario_actual
from app.core.ws_manager import manager  # Importamos el manager global
from . import repository as repo
from .schemas import (
    MensajeDirectoCreate,
    MensajeDirectoUpdate,
    MensajeDirectoResponse,
)

router = APIRouter(
    prefix="/mensajes-directos",
    tags=["Mensajes Directos"]
)

# ==========================================
# 1. ENDPOINTS REST
# ==========================================

@router.get("/", response_model=list[MensajeDirectoResponse])
def listar(
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    return repo.list_mensajes_directos(db)

@router.get("/{mensaje_directo_id}", response_model=MensajeDirectoResponse)
def obtener(
    mensaje_directo_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    mensaje = repo.get_by_id(db, mensaje_directo_id)

    if mensaje is None:
        raise HTTPException(
            status_code=404,
            detail="Mensaje directo no encontrado"
        )

    return mensaje

@router.post(
    "/",
    response_model=MensajeDirectoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear(
    data: MensajeDirectoCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    ok, error = repo.ensure_usuario(db, data.emisor_id)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    ok, error = repo.ensure_usuario(db, data.receptor_id)
    if not ok:
        raise HTTPException(status_code=400, detail=error)

    return repo.create(db, data)

@router.put(
    "/{mensaje_directo_id}",
    response_model=MensajeDirectoResponse
)
def actualizar(
    mensaje_directo_id: int,
    data: MensajeDirectoUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    updated = repo.update(db, mensaje_directo_id, data)

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Mensaje directo no encontrado"
        )

    return updated

@router.delete(
    "/{mensaje_directo_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def eliminar(
    mensaje_directo_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_usuario_actual),
):
    if not repo.delete(db, mensaje_directo_id):
        raise HTTPException(
            status_code=404,
            detail="Mensaje directo no encontrado"
        )

    return None

# ==========================================
# 2. WEBSOCKET (Solo para Directos)
# ==========================================

@router.websocket("/ws/directo/{usuario_id}")
async def websocket_directo(
    websocket: WebSocket,
    usuario_id: int,
    token: str | None = Query(default=None),
):
    try:
        payload = decodificar_token(token) if token else None
        usuario_autenticado_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        await websocket.close(code=1008)
        return

    if usuario_autenticado_id != usuario_id:
        await websocket.close(code=1008)
        return

    await manager.connect_directo(websocket, usuario_autenticado_id)
    db = SessionLocal()
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            mensaje_data = MensajeDirectoCreate(
                contenido=data["contenido"],
                emisor_id=usuario_autenticado_id,
                receptor_id=data["receptor_id"]
            )
            nuevo = repo.create(db, mensaje_data)
            
            payload = {
                "id_mensaje_directo": nuevo.id_mensaje_directo,
                "contenido": nuevo.contenido,
                "emisor_id": nuevo.emisor_id,
                "receptor_id": nuevo.receptor_id,
                "fecha_envio": nuevo.fecha_envio.isoformat(),
                "leido": nuevo.leido
            }
            
            # Enviamos al receptor (a TODAS sus conexiones activas)
            if data["receptor_id"] in manager.directos:
                for ws in manager.directos[data["receptor_id"]]:
                    await ws.send_json(payload)
                
            # Enviamos al emisor (a TODAS sus conexiones activas)
            if usuario_autenticado_id in manager.directos:
                for ws in manager.directos[usuario_autenticado_id]:
                    await ws.send_json(payload)

    except WebSocketDisconnect:
        manager.disconnect_directo(websocket, usuario_autenticado_id)
    finally:
        db.close()