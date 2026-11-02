from datetime import datetime, timedelta, timezone
import os
import sqlite3

import jwt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel

load_dotenv()


app = FastAPI()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
DATABASE_PATH = os.getenv("AUTH_DATABASE_PATH", "auth.db")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://kidchatbot-frontend.onrender.com",
    ).split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GoogleAuthRequest(BaseModel):
    token: str


def initialize_auth_database():
    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                google_sub TEXT UNIQUE,
                name TEXT NOT NULL,
                picture TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )


initialize_auth_database()


def issue_session_token(user_id: int, email: str):
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="JWT_SECRET_KEY is not configured on the backend.",
        )

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


@app.post("/api/auth/google")
def google_auth(data: GoogleAuthRequest):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="GOOGLE_CLIENT_ID is not configured on the backend.",
        )

    try:
        google_user = id_token.verify_oauth2_token(
            data.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as error:
        print("Google token verification failed:", error)
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    email = google_user.get("email")
    google_sub = google_user.get("sub")
    if not email or not google_sub or not google_user.get("email_verified", False):
        raise HTTPException(
            status_code=400,
            detail="Google account does not contain a verified email.",
        )

    name = google_user.get("name") or email.split("@", 1)[0]
    picture = google_user.get("picture")
    now = datetime.now(timezone.utc).isoformat()

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row
        user = connection.execute(
            "SELECT * FROM users WHERE google_sub = ? OR email = ?",
            (google_sub, email),
        ).fetchone()

        if user:
            connection.execute(
                """
                UPDATE users
                SET google_sub = ?, name = ?, picture = ?, updated_at = ?
                WHERE id = ?
                """,
                (google_sub, name, picture, now, user["id"]),
            )
            user_id = user["id"]
        else:
            cursor = connection.execute(
                """
                INSERT INTO users
                    (email, google_sub, name, picture, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (email, google_sub, name, picture, now, now),
            )
            user_id = cursor.lastrowid

    return {
        "access_token": issue_session_token(user_id, email),
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "google_sub": google_sub,
        },
    }


api_key = os.getenv("GROQ_API")


client = Groq(api_key=api_key) if api_key else None



@app.get("/")
def home():
    return {
        "message": "TTS Chatbot Backend is running!"
    }



@app.post("/ask")
def ask(data: dict):

    if client is None:
        return {
            "error": "GROQ_API is not configured. Add it to your .env file before calling /ask."
        }

    question = data.get("text")
    history = data.get("history", [])

    if not question:
        return {
            "answer": "Please enter a question."
        }

    if not isinstance(history, list):
        history = []

    conversation = [
        {
            "role": message["role"],
            "content": message["content"],
        }
        for message in history
        if isinstance(message, dict)
        and message.get("role") in {"user", "assistant"}
        and isinstance(message.get("content"), str)
        and message["content"].strip()
    ]
    conversation.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content":  """
You are a friendly, fun, and helpful AI assistant for kids! 🌈😊

- Use simple, kid-friendly language.
- Keep answers short, clear, and cheerful.
- Use emojis and simple visuals when helpful. 🎨
- Explain difficult topics step by step.
- Be kind, patient, encouraging, and honest.
- Answer questions directly and naturally.
- Ask a short clarifying question if needed.
- Keep children safe and protect their privacy. 🛡️
- Make learning fun and engaging! 🚀

IMPORTANT FOR VOICE OUTPUT:
Do not read aloud or speak any asterisks, Markdown formatting symbols, or formatting instructions. Speak only the actual message content naturally. Skip symbols such as *, **, #, backticks, and other non-spoken formatting characters.

Be SIMPLE, FRIENDLY, FUN, SAFE, and HELPFUL! 🎉
"""
                },
                *conversation,
            ]
        )

        answer = response.choices[0].message.content

        return {
            "answer": answer
        }

    except Exception as error:
        print("Groq Error:", error)

        return {
            "error": "Something went wrong with Groq API."
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
    )