from fastapi import APIRouter, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, List
import json

# Importamos tu SessionLocal desde core/db
from app.core.db import get_db, SessionLocal 
from . import repository as repo
from .schemas import MensajeCreate, MensajeUpdate, MensajeResponse
# Importamos lo necesario para mensajes directos
from app.api.v1.mensaje_directo import repository as repo_dm
from app.api.v1.mensaje_directo.schemas import MensajeDirectoCreate

router = APIRouter(prefix="/mensajes", tags=["Mensajes"])

# ==========================================
# 1. ENDPOINTS REST
# ==========================================

@router.get("/", response_model=list[MensajeResponse])
def listar(
    canal_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    resultado = repo.list_mensajes(db)
    if canal_id is not None:
        resultado = [m for m in resultado if m.canal_id == canal_id]
    return resultado

@router.get("/{mensaje_id}", response_model=MensajeResponse)
def obtener(mensaje_id: int, db: Session = Depends(get_db)):
    mensaje = repo.get_by_id(db, mensaje_id)
    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    return mensaje

@router.post("/", response_model=MensajeResponse, status_code=status.HTTP_201_CREATED)
def crear(data: MensajeCreate, db: Session = Depends(get_db)):
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
):
    mensaje = repo.get_by_id(db, mensaje_id)
    if mensaje is None:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    if mensaje.usuario_id != usuario_id:
        raise HTTPException(status_code=403, detail="Solo el autor puede eliminar el mensaje")
    repo.delete(db, mensaje_id)
    return None

# ==========================================
# 2. WEBSOCKETS (Tiempo real)
# ==========================================

class ConnectionManager:
    def __init__(self):
        # Conexiones para Canales: { canal_id: [ws1, ws2] }
        self.canales: Dict[int, List[WebSocket]] = {}
        # Conexiones para Directos: { usuario_id: ws }
        self.directos: Dict[int, WebSocket] = {}

    # --- Canales ---
    async def connect_canal(self, websocket: WebSocket, canal_id: int):
        await websocket.accept()
        if canal_id not in self.canales:
            self.canales[canal_id] = []
        self.canales[canal_id].append(websocket)

    def disconnect_canal(self, websocket: WebSocket, canal_id: int):
        if canal_id in self.canales:
            if websocket in self.canales[canal_id]:
                self.canales[canal_id].remove(websocket)
            if not self.canales[canal_id]:
                del self.canales[canal_id]

    async def broadcast_canal(self, message: dict, canal_id: int):
        if canal_id in self.canales:
            for connection in self.canales[canal_id]:
                await connection.send_json(message)

    # --- Directos ---
    async def connect_directo(self, websocket: WebSocket, usuario_id: int):
        await websocket.accept()
        self.directos[usuario_id] = websocket

    def disconnect_directo(self, usuario_id: int):
        if usuario_id in self.directos:
            del self.directos[usuario_id]

manager = ConnectionManager()

@router.websocket("/ws/canal/{canal_id}")
async def websocket_canal(websocket: WebSocket, canal_id: int):
    await manager.connect_canal(websocket, canal_id)
    db = SessionLocal()
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            mensaje_data = MensajeCreate(
                contenido=data["contenido"],
                usuario_id=data["usuario_id"],
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
            nuevo = repo_dm.create(db, mensaje_data)
            
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