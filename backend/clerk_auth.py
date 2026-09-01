"""Verify Clerk session JWTs (JWKS) and upsert the local users row."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
import jwt
from fastapi import Depends, HTTPException, Request
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from database import get_db
from models import User

load_dotenv(Path(__file__).resolve().parent / ".env")

CLERK_ISSUER = os.environ.get("CLERK_ISSUER", "https://wondrous-puma-85.clerk.accounts.dev").rstrip("/")
CLERK_JWKS_URL = os.environ.get("CLERK_JWKS_URL", f"{CLERK_ISSUER}/.well-known/jwks.json")


@lru_cache(maxsize=1)
def _jwk_client() -> PyJWKClient:
    return PyJWKClient(CLERK_JWKS_URL, cache_keys=True, lifespan=3600)


def clerk_claims(request: Request) -> dict:
    auth = request.headers.get("authorization") or ""
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    token = auth.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    try:
        key = _jwk_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            key.key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc


def upsert_user(db: Session, clerk_user_id: str, email: str | None) -> User:
    user = db.get(User, clerk_user_id)
    if user is None:
        user = User(clerk_user_id=clerk_user_id, email=email)
        db.add(user)
    elif email and user.email != email:
        user.email = email
    db.commit()
    db.refresh(user)
    return user


def current_clerk_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    claims = clerk_claims(request)
    sub = claims.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="Invalid token.")
    email = claims.get("email")
    if not isinstance(email, str):
        email = None
    return upsert_user(db, sub, email)
