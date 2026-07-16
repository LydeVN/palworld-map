import asyncio
import logging
import os
import sqlite3
import time
from contextlib import asynccontextmanager
from typing import Optional
import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# ----------------------------------------------------------------------------
# Configuration (Via .env avec fallbacks sécurisés)
# ----------------------------------------------------------------------------
POLL_INTERVAL_SECONDS = float(os.getenv("POLL_INTERVAL_SECONDS", "5"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "https://opal.lydecorp.fr").split(",")
DB_PATH = os.getenv("DB_PATH", "positions_history.db")
HISTORY_ENABLED = os.getenv("HISTORY_ENABLED", "true").lower() == "true"

# Variables de connexion à l'API REST de Palworld
PALWORLD_HOST = os.getenv("PALWORLD_HOST", "127.0.0.1")
PALWORLD_REST_PORT = os.getenv("PALWORLD_REST_PORT", "8212")
PALWORLD_ADMIN_PASSWORD = os.getenv("PALWORLD_ADMIN_PASSWORD", "KG2dfg209fxw")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("palworld-map")

REST_URL = f"http://{PALWORLD_HOST}:{PALWORLD_REST_PORT}/v1/api/players"

# ----------------------------------------------------------------------------
# État partagé
# ----------------------------------------------------------------------------
class SharedState:
    def __init__(self) -> None:
        self.last_players: list[dict] = []
        self.last_update_ts: Optional[float] = None
        self.last_error: Optional[str] = None
        self.connected_clients: set[WebSocket] = set()

state = SharedState()

# ----------------------------------------------------------------------------
# SQLite (Historisation)
# ----------------------------------------------------------------------------
def init_db() -> None:
    if not HISTORY_ENABLED:
        return
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_uid TEXT NOT NULL,
            player_name TEXT NOT NULL,
            level INTEGER,
            location_x REAL,
            location_y REAL,
            ping REAL,
            captured_at REAL NOT NULL
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_positions_player_time ON positions(player_uid, captured_at)"
    )
    conn.commit()
    conn.close()

def persist_snapshot(players: list[dict], ts: float) -> None:
    if not HISTORY_ENABLED:
        return
    conn = sqlite3.connect(DB_PATH)
    formatted_players = []
    for p in players:
        formatted_players.append({
            "userId": p.get("userId") or "unknown",
            "name": p.get("name") or "unknown",
            "level": p.get("level", 1),
            "location_x": p.get("location_x", 0.0),
            "location_y": p.get("location_y", 0.0),
            "ping": p.get("ping", 0.0),
            "ts": ts
        })
    
    conn.executemany(
        """
        INSERT INTO positions (player_uid, player_name, level, location_x, location_y, ping, captured_at)
        VALUES (:userId, :name, :level, :location_x, :location_y, :ping, :ts)
        """,
        formatted_players,
    )
    conn.commit()
    conn.close()

# ----------------------------------------------------------------------------
# Client API REST (Aligné à 100% sur le format curl de Palworld)
# ----------------------------------------------------------------------------
async def fetch_players_from_rest() -> list[dict]:
    players_list = []
    auth = ("admin", PALWORLD_ADMIN_PASSWORD)
    
    async with httpx.AsyncClient(timeout=4.0) as client:
        response = await client.get(REST_URL, auth=auth)
        
    if response.status_code != 200:
        raise Exception(f"Erreur API REST HTTP {response.status_code} : {response.text}")
        
    data = response.json()
    raw_players = data.get("players", [])
    
    for p in raw_players:
        players_list.append({
            "userId": p.get("userId") or p.get("playerId") or "unknown",
            "name": p.get("name") or "Aventurier",
            "level": int(p.get("level", 1)),
            "location_x": float(p.get("location_x", 0.0)),
            "location_y": float(p.get("location_y", 0.0)),
            "ping": float(p.get("ping", 45.0))
        })
        
    return players_list

async def poll_loop() -> None:
    while True:
        start = time.monotonic()
        try:
            players = await fetch_players_from_rest()
            
            now = time.time()
            state.last_players = players
            state.last_update_ts = now
            state.last_error = None

            if HISTORY_ENABLED and players:
                await asyncio.to_thread(persist_snapshot, players, now)

            await broadcast_to_websockets(
                {"type": "players_update", "players": players, "ts": now}
            )

        except Exception as e:
            state.last_error = f"Erreur API REST : {str(e)}"
            log.error(state.last_error)

        elapsed = time.monotonic() - start
        await asyncio.sleep(max(1.0, POLL_INTERVAL_SECONDS - elapsed))

async def broadcast_to_websockets(message: dict) -> None:
    dead: list[WebSocket] = []
    for ws in state.connected_clients:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        state.connected_clients.discard(ws)

# ----------------------------------------------------------------------------
# Application FastAPI
# ----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(poll_loop())
    log.info(f"API REST Active. Monitoring toutes les {POLL_INTERVAL_SECONDS}s.")
    yield
    task.cancel()

app = FastAPI(title="Palworld Live Map API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {
        "server_reachable": state.last_error is None,
        "last_error": state.last_error,
        "last_update_ts": state.last_update_ts,
    }

@app.get("/api/players")
async def get_players():
    return {
        "players": state.last_players,
        "last_update_ts": state.last_update_ts,
        "error": state.last_error,
    }

@app.websocket("/ws/players")
async def ws_players(websocket: WebSocket):
    await websocket.accept()
    state.connected_clients.add(websocket)
    await websocket.send_json(
        {"type": "players_update", "players": state.last_players, "ts": state.last_update_ts}
    )
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        state.connected_clients.discard(websocket)