"""CareCircle API: local-first auth, linked care circles, records, alerts and safe assistant."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

DB_PATH = Path(os.getenv("CARECIRCLE_DB", Path(__file__).with_name("carecircle.db")))
SECRET = os.getenv("CARECIRCLE_SECRET", "dev-only-change-me-before-deployment").encode()
TOKEN_TTL = 60 * 60 * 24 * 7

app = FastAPI(title="CareCircle API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer(auto_error=False)


@contextmanager
def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db():
    with db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('senior','caregiver')),
          invite_code TEXT UNIQUE, linked_senior_id INTEGER REFERENCES users(id), created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS medicines (
          id INTEGER PRIMARY KEY AUTOINCREMENT, senior_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL, detail TEXT NOT NULL, time TEXT NOT NULL, taken INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT, senior_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL, owner TEXT NOT NULL, due TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS checkins (
          id INTEGER PRIMARY KEY AUTOINCREMENT, senior_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          mood TEXT NOT NULL, created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT, senior_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          contact TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
        );
        """)


@app.on_event("startup")
def startup():
    init_db()


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"{base64.urlsafe_b64encode(salt).decode()}:{base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    salt_b64, digest_b64 = stored.split(":", 1)
    expected = base64.urlsafe_b64decode(digest_b64)
    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), base64.urlsafe_b64decode(salt_b64), 210_000)
    return hmac.compare_digest(actual, expected)


def encode_token(user_id: int) -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"sub": user_id, "exp": int(time.time()) + TOKEN_TTL}).encode()).decode().rstrip("=")
    signature = base64.urlsafe_b64encode(hmac.new(SECRET, payload.encode(), hashlib.sha256).digest()).decode().rstrip("=")
    return f"{payload}.{signature}"


def decode_token(token: str) -> int:
    try:
        payload, supplied = token.split(".")
        expected = base64.urlsafe_b64encode(hmac.new(SECRET, payload.encode(), hashlib.sha256).digest()).decode().rstrip("=")
        if not hmac.compare_digest(supplied, expected): raise ValueError
        data = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if data["exp"] < time.time(): raise ValueError
        return int(data["sub"])
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired session") from exc


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    if not credentials: raise HTTPException(status_code=401, detail="Please sign in")
    user_id = decode_token(credentials.credentials)
    with db() as conn:
        row = conn.execute("SELECT id,name,email,role,invite_code,linked_senior_id FROM users WHERE id=?", (user_id,)).fetchone()
    if not row: raise HTTPException(status_code=401, detail="Account not found")
    return dict(row)


def senior_id_for(user: dict) -> int:
    if user["role"] == "senior": return user["id"]
    if not user["linked_senior_id"]: raise HTTPException(status_code=409, detail="Link this caregiver to a senior first")
    return user["linked_senior_id"]


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["senior", "caregiver"]


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class LinkBody(BaseModel):
    invite_code: str = Field(min_length=6, max_length=12)


class CheckinBody(BaseModel):
    mood: Literal["Great", "Good", "Not well"]


class TaskBody(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    owner: str = Field(min_length=2, max_length=80)
    due: str = Field(min_length=2, max_length=80)


class AlertBody(BaseModel):
    contact: str = Field(min_length=2, max_length=80)


class AssistantBody(BaseModel):
    question: str = Field(min_length=2, max_length=500)


def public_user(row: sqlite3.Row | dict):
    return {key: row[key] for key in ("id", "name", "email", "role", "invite_code", "linked_senior_id")}


@app.get("/health")
def health(): return {"status": "ok"}


@app.post("/auth/register", status_code=201)
def register(body: RegisterBody):
    code = secrets.token_hex(3).upper() if body.role == "senior" else None
    try:
        with db() as conn:
            cursor = conn.execute("INSERT INTO users(name,email,password_hash,role,invite_code,created_at) VALUES(?,?,?,?,?,?)", (body.name, body.email.lower(), password_hash(body.password), body.role, code, int(time.time())))
            user_id = cursor.lastrowid
            if body.role == "senior":
                conn.executemany("INSERT INTO medicines(senior_id,name,detail,time,taken) VALUES(?,?,?,?,?)", [(user_id,"Amlodipine","5 mg · After breakfast","8:00 AM",0),(user_id,"Vitamin D","1 tablet · With food","1:00 PM",0),(user_id,"Metformin","500 mg · After dinner","7:00 PM",0)])
            row = conn.execute("SELECT id,name,email,role,invite_code,linked_senior_id FROM users WHERE id=?", (user_id,)).fetchone()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
    return {"token": encode_token(user_id), "user": public_user(row)}


@app.post("/auth/login")
def login(body: LoginBody):
    with db() as conn: row = conn.execute("SELECT * FROM users WHERE email=?", (body.email.lower(),)).fetchone()
    if not row or not verify_password(body.password, row["password_hash"]): raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"token": encode_token(row["id"]), "user": public_user(row)}


@app.get("/me")
def me(user=Depends(current_user)): return user


@app.post("/care-circle/link")
def link(body: LinkBody, user=Depends(current_user)):
    if user["role"] != "caregiver": raise HTTPException(status_code=403, detail="Only caregiver accounts use invitation codes")
    with db() as conn:
        senior = conn.execute("SELECT id,name FROM users WHERE role='senior' AND invite_code=?", (body.invite_code.upper(),)).fetchone()
        if not senior: raise HTTPException(status_code=404, detail="Invitation code not found")
        conn.execute("UPDATE users SET linked_senior_id=? WHERE id=?", (senior["id"], user["id"]))
    return {"linked": True, "senior": dict(senior)}


@app.get("/care-data")
def care_data(user=Depends(current_user)):
    sid = senior_id_for(user)
    with db() as conn:
        meds = [dict(r) | {"taken": bool(r["taken"])} for r in conn.execute("SELECT id,name,detail,time,taken FROM medicines WHERE senior_id=? ORDER BY id", (sid,))]
        tasks = [dict(r) | {"done": bool(r["done"])} for r in conn.execute("SELECT id,title,owner,due,done FROM tasks WHERE senior_id=? ORDER BY id DESC", (sid,))]
        checkin = conn.execute("SELECT mood,created_at FROM checkins WHERE senior_id=? ORDER BY id DESC LIMIT 1", (sid,)).fetchone()
        alerts = [dict(r) | {"resolved": bool(r["resolved"])} for r in conn.execute("SELECT id,contact,resolved,created_at FROM alerts WHERE senior_id=? ORDER BY id DESC", (sid,))]
    return {"medicines": meds, "tasks": tasks, "checkin": dict(checkin) if checkin else None, "alerts": alerts}


@app.patch("/medicines/{medicine_id}/taken")
def take_medicine(medicine_id: int, user=Depends(current_user)):
    sid = senior_id_for(user)
    with db() as conn:
        result = conn.execute("UPDATE medicines SET taken=1 WHERE id=? AND senior_id=?", (medicine_id, sid))
        if not result.rowcount: raise HTTPException(status_code=404, detail="Medicine not found")
    return {"updated": True}


@app.post("/checkins", status_code=201)
def checkin(body: CheckinBody, user=Depends(current_user)):
    sid = senior_id_for(user)
    with db() as conn: conn.execute("INSERT INTO checkins(senior_id,mood,created_at) VALUES(?,?,?)", (sid, body.mood, int(time.time())))
    return {"saved": True}


@app.post("/tasks", status_code=201)
def create_task(body: TaskBody, user=Depends(current_user)):
    sid = senior_id_for(user)
    with db() as conn:
        cursor = conn.execute("INSERT INTO tasks(senior_id,title,owner,due) VALUES(?,?,?,?)", (sid,body.title,body.owner,body.due))
    return {"id": cursor.lastrowid, **body.model_dump(), "done": False}


@app.patch("/tasks/{task_id}/toggle")
def toggle_task(task_id: int, user=Depends(current_user)):
    sid = senior_id_for(user)
    with db() as conn:
        row = conn.execute("SELECT done FROM tasks WHERE id=? AND senior_id=?", (task_id,sid)).fetchone()
        if not row: raise HTTPException(status_code=404, detail="Task not found")
        done = not bool(row["done"]); conn.execute("UPDATE tasks SET done=? WHERE id=?", (done,task_id))
    return {"done": done}


@app.post("/alerts", status_code=201)
def create_alert(body: AlertBody, user=Depends(current_user)):
    sid = senior_id_for(user)
    with db() as conn:
        cursor = conn.execute("INSERT INTO alerts(senior_id,contact,created_at) VALUES(?,?,?)", (sid,body.contact,int(time.time())))
    return {"id": cursor.lastrowid, "contact": body.contact, "resolved": False, "created_at": int(time.time())}


@app.patch("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, user=Depends(current_user)):
    sid = senior_id_for(user)
    with db() as conn: conn.execute("UPDATE alerts SET resolved=1 WHERE id=? AND senior_id=?", (alert_id,sid))
    return {"resolved": True}


@app.post("/assistant")
def assistant(body: AssistantBody, user=Depends(current_user)):
    sid = senior_id_for(user); q = body.question.lower()
    with db() as conn:
        next_med = conn.execute("SELECT name,time FROM medicines WHERE senior_id=? AND taken=0 ORDER BY id LIMIT 1", (sid,)).fetchone()
    if any(word in q for word in ("medicine","medication","drug")):
        answer = f"Your next medicine is {next_med['name']} at {next_med['time']}." if next_med else "All of today's medicines are marked as taken."
    elif any(word in q for word in ("appointment","plan","today")): answer = "You have physiotherapy with Dr. Bello at the Wellness Centre at 3:30 PM."
    elif any(word in q for word in ("help","emergency")): answer = "Use the I need help button to alert your family, or call local emergency services if there is immediate danger."
    else: answer = "I can help with your medicines, appointments, family circle and help requests. I cannot diagnose a medical condition."
    return {"answer": answer, "mode": "controlled-care-assistant"}
