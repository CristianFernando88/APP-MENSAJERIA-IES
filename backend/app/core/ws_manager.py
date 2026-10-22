# app/core/ws_manager.py
from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Conexiones para Canales: { canal_id: [ws1, ws2] }
        self.canales: Dict[int, List[WebSocket]] = {}
        # Conexiones para Directos: { usuario_id: [ws1, ws2] }
        self.directos: Dict[int, List[WebSocket]] = {}

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
        if usuario_id not in self.directos:
            self.directos[usuario_id] = []
        self.directos[usuario_id].append(websocket)

    def disconnect_directo(self, websocket: WebSocket, usuario_id: int):
        if usuario_id in self.directos:
            if websocket in self.directos[usuario_id]:
                self.directos[usuario_id].remove(websocket)
            if not self.directos[usuario_id]:
                del self.directos[usuario_id]

# Instancia global que será importada por los routers
manager = ConnectionManager()