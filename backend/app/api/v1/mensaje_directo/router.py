from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import json

from app.core.db import get_db, SessionLocal
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
def listar(db: Session = Depends(get_db)):
    return repo.list_mensajes_directos(db)

@router.get("/{mensaje_directo_id}", response_model=MensajeDirectoResponse)
def obtener(
    mensaje_directo_id: int,
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
async def websocket_directo(websocket: WebSocket, usuario_id: int):
    await manager.connect_directo(websocket, usuario_id)
    db = SessionLocal()
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            mensaje_data = MensajeDirectoCreate(
                contenido=data["contenido"],
                emisor_id=usuario_id,
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
            
            # Enviamos al receptor (si está conectado)
            if data["receptor_id"] in manager.directos:
                await manager.directos[data["receptor_id"]].send_json(payload)
                
            # Enviamos al emisor (para que vea su propio mensaje)
            if usuario_id in manager.directos:
                await manager.directos[usuario_id].send_json(payload)

    except WebSocketDisconnect:
        manager.disconnect_directo(usuario_id)
    finally:
        db.close()